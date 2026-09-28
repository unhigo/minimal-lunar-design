/**
 * SiteMenubar — shadcn/ui Menubar (menubar-04: groups + submenus), dressed
 * in the liquid-glass system.
 *
 * · Menus are the five sections of the lab (NAV_SECTIONS in src/lib/nav.ts).
 * · Every item is a real route — category and subcategory links carry the
 *   query params each page already honors (`?s=`, `?tag=`, `?cat=`, `?q=`,
 *   `?sort=`). No data or navigation changed; only the organization.
 * · Hover opens menus (classic menubar behavior); Radix handles dismissal
 *   (outside click, Escape, item activation). The active route lights a
 *   signal dot — §15: red is a signal, never decoration.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { NAV_SECTIONS, type NavLinkDef } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** "/tools/slug" → "/tools" · "/" → "/" — for section highlighting. */
function routeBase(pathname: string): string {
  if (pathname === "/") return "/";
  return `/${pathname.split("/")[1] ?? ""}`;
}

function MenuLink({
  link,
  activeBase,
  onNavigate,
}: {
  link: NavLinkDef;
  activeBase: string;
  onNavigate: () => void;
}) {
  const target = link.to.split("?")[0];
  const active = target === activeBase;
  return (
    <MenubarItem asChild>
      <Link
        to={link.to}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "cursor-pointer justify-between gap-6 font-mono text-[12px] tracking-wide",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="flex items-center gap-2">
          {active && <span aria-hidden className="signal-dot size-1.5" />}
          {link.label}
        </span>
        {link.hint && (
          <span className="text-[10px] tracking-[0.08em] text-muted-foreground/60">
            {link.hint}
          </span>
        )}
      </Link>
    </MenubarItem>
  );
}

export function SiteMenubar({ className }: { className?: string }) {
  const [open, setOpen] = useState<string>("");
  const { pathname } = useLocation();
  const base = routeBase(pathname);

  // Route changes (including menu-driven ones) collapse any open menu.
  useEffect(() => setOpen(""), [pathname]);

  /** First section containing the current base route lights its trigger. */
  const activeSection = NAV_SECTIONS.find((section) =>
    section.groups.some((g) =>
      [...g.links, ...(g.subs ?? []).flatMap((s) => s.links)].some(
        (l) => l.to.split("?")[0] === base,
      ),
    ),
  )?.id;

  return (
    <Menubar
      value={open}
      onValueChange={setOpen}
      className={cn(
        "glass-panel h-auto gap-0.5 rounded-full border-0 p-1 shadow-none",
        className,
      )}
    >
      {NAV_SECTIONS.map((section) => {
        const sectionActive = section.id === activeSection;
        return (
          <MenubarMenu key={section.id} value={section.id}>
            <MenubarTrigger
              onMouseEnter={() => setOpen(section.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em]",
                "focus:bg-white/10 focus:text-foreground data-[highlighted]:bg-white/10 data-[highlighted]:text-foreground",
                "data-[state=open]:bg-white/10 data-[state=open]:text-foreground",
                sectionActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {sectionActive && (
                <span aria-hidden className="signal-dot mr-1.5 inline-block size-1.5" />
              )}
              {section.label}
            </MenubarTrigger>

            <MenubarContent
              className={cn(
                "glass-panel min-w-[15rem] rounded-xl border-0 p-1.5 shadow-none",
              )}
            >
              {section.groups.map((group, gi) => (
                <MenubarGroup key={group.label}>
                  {gi > 0 && <MenubarSeparator className="bg-white/10" />}
                  <p className="px-2.5 pt-2 pb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground/70">
                    {group.label}
                  </p>
                  {group.links.map((link) => (
                    <MenuLink
                      key={link.to + link.label}
                      link={link}
                      activeBase={base}
                      onNavigate={() => setOpen("")}
                    />
                  ))}
                  {group.subs?.map((sub) => (
                    <MenubarSub key={sub.label}>
                      <MenubarSubTrigger className="rounded-sm px-2.5 py-1.5 font-mono text-[12px] tracking-wide text-muted-foreground data-[state=open]:bg-white/10 data-[state=open]:text-foreground">
                        {sub.label}
                      </MenubarSubTrigger>
                      <MenubarSubContent
                        sideOffset={10}
                        className={cn(
                          "glass-panel max-h-[60dvh] min-w-[13rem] overflow-y-auto rounded-xl border-0 p-1.5 shadow-none",
                        )}
                      >
                        {sub.links.map((link) => (
                          <MenuLink
                            key={link.to + link.label}
                            link={link}
                            activeBase={base}
                            onNavigate={() => setOpen("")}
                          />
                        ))}
                      </MenubarSubContent>
                    </MenubarSub>
                  ))}
                </MenubarGroup>
              ))}
            </MenubarContent>
          </MenubarMenu>
        );
      })}
    </Menubar>
  );
}
