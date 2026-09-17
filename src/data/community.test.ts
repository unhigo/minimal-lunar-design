import { describe, expect, it } from "vitest";
import {
  ARTICLES,
  CREATORS,
  PROJECTS,
  articlesAboutTool,
  articlesByCreator,
  creatorsUsingTool,
  getArticleBySlug,
  getCreatorBySlug,
  getProjectBySlug,
  projectsByCreator,
  projectsUsingTool,
  relatedArticles,
  relatedProjects,
  searchArticles,
  searchCreators,
  searchProjects,
} from "./community";
import { TOOLS } from "./tools";
import { resolveEntry } from "@/lib/collections";

/** Slugs referenced across the community graph must exist in TOOLS. */
const toolSlugs = new Set(TOOLS.map((t) => t.slug));

describe("community data integrity", () => {
  it("every project references an existing creator", () => {
    const creatorSlugs = new Set(CREATORS.map((c) => c.slug));
    for (const project of PROJECTS) {
      expect(
        creatorSlugs.has(project.creatorSlug),
        `project ${project.slug} → unknown creator ${project.creatorSlug}`,
      ).toBe(true);
    }
  });

  it("every project and article references existing tool slugs", () => {
    for (const project of PROJECTS) {
      for (const tool of project.tools) {
        expect(
          toolSlugs.has(tool),
          `project ${project.slug} → unknown tool ${tool}`,
        ).toBe(true);
      }
    }
    for (const article of ARTICLES) {
      for (const tool of article.relatedToolSlugs) {
        expect(
          toolSlugs.has(tool),
          `article ${article.slug} → unknown tool ${tool}`,
        ).toBe(true);
      }
    }
    for (const creator of CREATORS) {
      for (const tool of creator.tools) {
        expect(
          toolSlugs.has(tool),
          `creator ${creator.slug} → unknown tool ${tool}`,
        ).toBe(true);
      }
    }
  });

  it("every article author and demo flag exist", () => {
    const creatorSlugs = new Set(CREATORS.map((c) => c.slug));
    for (const article of ARTICLES) {
      expect(
        creatorSlugs.has(article.authorSlug),
        `article ${article.slug} → unknown author ${article.authorSlug}`,
      ).toBe(true);
      expect(article.demo).toBe(true);
      expect(article.readingMinutes).toBeGreaterThan(0);
    }
  });

  it("slugs are unique within each entity", () => {
    expect(new Set(CREATORS.map((c) => c.slug)).size).toBe(CREATORS.length);
    expect(new Set(PROJECTS.map((p) => p.slug)).size).toBe(PROJECTS.length);
    expect(new Set(ARTICLES.map((a) => a.slug)).size).toBe(ARTICLES.length);
  });

  it("interlinking helpers resolve both directions", () => {
    // pick a tool that projects actually use
    const usedTool = PROJECTS[0].tools[0];
    expect(projectsUsingTool(usedTool).length).toBeGreaterThan(0);
    const project = projectsUsingTool(usedTool)[0];
    expect(project.tools).toContain(usedTool);

    const creator = getCreatorBySlug(project.creatorSlug);
    expect(creator).toBeDefined();
    expect(projectsByCreator(creator!.slug).some((p) => p.slug === project.slug)).toBe(true);
  });
});

describe("community lookups and search", () => {
  it("getters find seeds and return undefined for unknown slugs", () => {
    expect(getProjectBySlug("orbital-saas")?.title).toContain("Orbital");
    expect(getArticleBySlug("paleta-sin-gradiente")).toBeDefined();
    expect(getCreatorBySlug("lucia-demo")).toBeDefined();
    expect(getProjectBySlug("nope")).toBeUndefined();
  });

  it("searchProjects filters by query and category", () => {
    expect(searchProjects("orbital").length).toBe(1);
    expect(searchProjects("", "3d").every((p) => p.category === "3d")).toBe(true);
    expect(searchProjects("zzz-no-match")).toHaveLength(0);
  });

  it("searchArticles matches title, excerpt and tags", () => {
    expect(searchArticles("licencias").length).toBeGreaterThan(0);
    expect(searchArticles("luna").length).toBeGreaterThan(0);
    expect(searchArticles("", "tipografía").every((a) => a.category === "tipografía")).toBe(true);
  });

  it("searchCreators matches name, bio and skills", () => {
    expect(searchCreators("ilustración").length).toBeGreaterThan(0);
    expect(searchCreators("", "3d").every((c) => c.type === "3d")).toBe(true);
  });

  it("related helpers never include the entity itself", () => {
    const project = getProjectBySlug("orbital-saas")!;
    expect(relatedProjects(project).every((p) => p.slug !== project.slug)).toBe(true);
    const article = getArticleBySlug("paleta-sin-gradiente")!;
    expect(relatedArticles(article).every((a) => a.slug !== article.slug)).toBe(true);
  });
});

describe("collections resolver", () => {
  it("resolves tools, projects, articles and creators to links", () => {
    expect(resolveEntry("tool", "t-01")).toMatchObject({
      href: "/tools/figma",
      missing: false,
    });
    expect(resolveEntry("project", "orbital-saas").href).toBe("/projects/orbital-saas");
    expect(resolveEntry("article", "licencias-recursos-diseno").href).toBe(
      "/articles/licencias-recursos-diseno",
    );
    expect(resolveEntry("creator", "lucia-demo").href).toBe("/creators/lucia-demo");
  });

  it("marks missing entries instead of throwing", () => {
    expect(resolveEntry("tool", "t-999").missing).toBe(true);
    expect(resolveEntry("inspiration", "i-01").href).toBeNull();
    expect(resolveEntry("resource", "abc123").href).toBe("/resource/abc123");
  });

  it("articlesAboutTool / creatorsUsingTool mirror the graph", () => {
    expect(articlesAboutTool("squoosh").length).toBeGreaterThan(0);
    expect(creatorsUsingTool("figma").length).toBeGreaterThan(0);
  });
});
