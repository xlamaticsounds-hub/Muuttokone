import Link from 'next/link';
import Image from 'next/image';
import FooterBottom from '@/components/Footer/FooterBottom';
import footerNavData from '@/components/Footer/footerNavData';
import FooterSocialLinks from '@/components/Footer/FooterSocialLinks';
import SlideOnReveal from '@/components/SlideOnReveal';
import { siteConfig } from '@/config/site';

export default function Footer() {
  return (
    <>
      <footer>
        <div className="mx-auto max-w-1390 px-4 md:px-8 2xl:px-0">
          <div className="py-12 lg:py-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {/* Column 1: Logo & About */}
              <div className="animate_top">
                <Link href="/">
                  <Image
                    src="/icons/logo.webp"
                    alt="Logo"
                    className="dark:hidden"
                    width={130}
                    height={44}
                  />
                  <Image
                    src="/images/logo/logo.webp"
                    alt="Logo"
                    className="hidden dark:block"
                    width={130}
                    height={44}
                  />
                </Link>

                <p className="mt-5 mb-8 text-base">
                  Luotettava muuttopalveluyritys Helsingissä ja Uudellamaalla. Tarjoamme
                  ammattitaitoisia koti- ja yritysmuuttoja, pakkausta, kuljetuksia ja kuolinpesätyhjennyksiä.
                </p>

                <FooterSocialLinks />
              </div>

              {/* Column 2: Contact Details (Now in the middle) */}
              <div className="animate_top lg:pl-8">
                <h4 className="mb-6 text-xl font-bold text-black dark:text-white">Yhteystiedot</h4>
                <ul className="space-y-4 text-sm font-medium text-black/70 dark:text-white/70">
                  <li className="flex items-center gap-3">
                    <span className="text-lg">📞</span>
                    <a href={`tel:${siteConfig.contact.phone.tel}`} className="hover:text-primary transition-colors">
                      {siteConfig.contact.phone.display}
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-lg">✉️</span>
                    <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-primary transition-colors">
                      {siteConfig.contact.email}
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-lg">🕒</span>
                    <span className="leading-relaxed">{siteConfig.contact.openingHours}</span>
                  </li>
                </ul>
              </div>

              {/* Column 3 & 4: Navigation Links */}
              {footerNavData.map((group, groupIndex) => (
                <div key={groupIndex} className="animate_top lg:pl-8">
                  <SlideOnReveal delay={0.2 + groupIndex * 0.05}>
                    <div>
                      <h4 className="mb-6 text-xl font-bold text-black dark:text-white">{group.title}</h4>
                      <ul className="space-y-3">
                        {group.navItems &&
                          group.navItems.map((item, index) => (
                            <li key={index} className="group">
                              <Link
                                href={item.route}
                                className="hover:text-primary text-sm font-medium text-black/70 dark:text-white/70 inline-flex items-center gap-1 transition-colors duration-200"
                              >
                                {item.label}
                                <span className="translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                                  →
                                </span>
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </SlideOnReveal>
                </div>
              ))}
            </div>
          </div>

          <FooterBottom />
        </div>
      </footer>
    </>
  );
}