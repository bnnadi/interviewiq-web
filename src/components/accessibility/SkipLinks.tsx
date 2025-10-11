import React from 'react'
import { Link } from 'react-router-dom'

interface SkipLink {
  href: string
  label: string
  target?: string
}

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' }
]

const SkipLinks: React.FC<SkipLinksProps> = ({ 
  links = defaultSkipLinks, 
  className = '' 
}) => {
  return (
    <div className={`skip-links ${className}`}>
      {links.map((link, index) => (
        <Link
          key={index}
          to={link.href}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            const target = document.querySelector(link.href)
            if (target) {
              const targetElement = target as HTMLElement
              targetElement.focus()
              targetElement.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

export default SkipLinks
