import Link from 'next/link';
import Image from 'next/image';
import FooterBottom from '@/components/Footer/FooterBottom';
import footerNavData from '@/components/Footer/footerNavData';
import FooterSocialLinks from '@/components/Footer/FooterSocialLinks';
import FooterNewsletter from '@/components/Footer/FooterNewsletter';
import SlideOnReveal from '@/components/SlideOnReveal';

export default function Footer() {
  return (
    <>
      <footer>
        <div className="mx-auto max-w-1390 px-4 md:px-8 2xl:px-0">
          <div className="py-20 lg:py-25">
            <div className="flex flex-wrap gap-8 lg:justify-between lg:gap-8">
              <div className="animate_top w-1/2 lg:w-1/4">
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

                <p className="mt-5 mb-10">
                  Luotettava muuttopalveluyritys Helsingissä. Tarjoamme ammattitaitoisia koti- ja
                  yritysmuuttoja, pakkausta, varastointia ja siivouspalveluja.
                </p>

                <FooterSocialLinks />
              </div>

              <div className="flex w-full flex-col gap-8 md:flex-row md:items-start md:justify-between lg:w-[70%]">
                {/* Newsletter in the center column (relative to the whole footer) */}
                <SlideOnReveal delay={0.15}>
                  <div className="mt-8 md:mt-12 md:ml-4 md:max-w-md md:flex-1 lg:ml-6">
                    <FooterNewsletter />
                  </div>
                </SlideOnReveal>

                {/* Navigation groups pushed to the far right */}
                <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 md:mt-12 md:ml-auto">
                  {footerNavData.map((group, groupIndex) => (
                    <SlideOnReveal key={groupIndex} delay={0.2 + groupIndex * 0.05}>
                      <div>
                        <h4 className="mb-6 text-2xl text-black dark:text-white">{group.title}</h4>
                        <ul>
                          {group.navItems &&
                            group.navItems.map((item, index) => (
                              <li key={index} className="group">
                                <Link
                                  href={item.route}
                                  className="hover:text-primary mb-3 inline-flex items-center gap-1 transition-colors duration-200"
                                >
                                  {item.label}
                                  <span className="translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                                    →
                                  </span>
                                  {item.badge && (
                                    <span className="bg-meta-green ml-2.5 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-white">
                                      Hiring
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </SlideOnReveal>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <FooterBottom />
        </div>
      </footer>
    </>
  );
}
