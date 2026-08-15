import { Link } from 'react-router-dom';
import { Trophy, Globe, Share2, Mail } from 'lucide-react';

const footerSections = [
  {
    heading: 'Discover',
    links: [
      { label: 'All Events', href: '/events' },
      { label: 'Sports Editorial & News', href: '/blog' },
      { label: 'Cricket', href: '/events?sport=cricket' },
      { label: 'Football', href: '/events?sport=football' },
      { label: 'Badminton', href: '/events?sport=badminton' },
      { label: 'Kabaddi', href: '/events?sport=kabaddi' },
    ],
  },
  {
    heading: 'Cities',
    links: [
      { label: 'Chennai', href: '/events?city=chennai' },
      { label: 'Coimbatore', href: '/events?city=coimbatore' },
      { label: 'Madurai', href: '/events?city=madurai' },
      { label: 'Salem', href: '/events?city=salem' },
      { label: 'Tiruppur', href: '/events?city=tiruppur' },
      { label: 'Trichy', href: '/events?city=tiruchirapalli' },
    ],
  },
  {
    heading: 'Organize',
    links: [
      { label: 'Create an Event', href: '/organizer/register' },
      { label: 'Organizer Dashboard', href: '/organizer/dashboard' },
      { label: 'Pricing', href: '#' },
      { label: 'How It Works', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About KnowASport', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main footer content */}
      <div className="kas-container py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 focus-visible:outline-none">
              <div className="w-8 h-8 rounded-[8px] bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="font-800 text-[17px] text-white tracking-tight">
                Know<span className="text-amber-500">A</span>Sport
              </span>
            </Link>
            <p className="text-[13px] text-neutral-400 leading-relaxed max-w-[200px] mb-5">
              Discover and register for sports events across Tamil Nadu.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="#" icon={Globe} label="Instagram" />
              <SocialLink href="#" icon={Share2} label="Twitter" />
              <SocialLink href="#" icon={Mail} label="Email" />
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map(section => (
            <div key={section.heading}>
              <h4 className="text-[12px] font-700 text-neutral-400 uppercase tracking-wider mb-4">
                {section.heading}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-neutral-400 hover:text-white transition-colors duration-150 focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="kas-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-neutral-500">
            © {year} KnowASport. All rights reserved. Made with ❤️ for Tamil Nadu sports.
          </p>
          <div className="flex items-center gap-4">
            <Link to="#" className="text-[12px] text-neutral-500 hover:text-neutral-400 transition-colors">Privacy</Link>
            <Link to="#" className="text-[12px] text-neutral-500 hover:text-neutral-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-8 h-8 rounded-[8px] bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <Icon size={15} />
    </a>
  );
}
