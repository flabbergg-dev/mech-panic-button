import Link from "next/link"
import { usePathname } from "next/navigation"
import { DashboardLinks, HomeLinks } from "@/utils/constants/navbar-links"


interface NavLinksProps {
  textStyles?: string
  userId?: unknown
}

export const NavLinks = ({ textStyles, userId }: NavLinksProps) => {
  const pathname = usePathname()

  return (
    <>
      {pathname === "/" || pathname === "/about" || pathname === "/contact"
        ? HomeLinks.map((link) => (
            <Link
              className={textStyles}
              key={link}
              href={link === "Home" ? "/" : `/${link.toLowerCase()}`}
            >
              {link}
            </Link>
          ))
        : DashboardLinks.map((link) => (
            <Link
              className={textStyles}
              key={link}
              href={`/onboarding?newuser=false`}
            >
              {link}
            </Link>
          ))}
    </>
  )
}
