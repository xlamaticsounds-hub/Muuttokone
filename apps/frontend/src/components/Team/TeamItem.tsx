import Image from "next/image";
import { Team } from "@/types/team";
import Link from "next/link";

export default function TeamItem({ team }: { team: Team }) {
  return (
    <>
      <div className="animate_top text-center">
        <div className="group relative z-1 overflow-hidden">
          <Image
            className="w-full rounded-md object-cover"
            src={team.img}
            alt={team.name}
            width={360}
            height={370}
          />

          <div className="translate-y-25 duration-300 ease-linear group-hover:translate-y-0">
            <span className="absolute -bottom-21 -left-5 z-20 block h-37.5 w-[120%] rotate-6 bg-primary"></span>
            <span className="absolute bottom-0 left-0 z-10 block h-17 w-full bg-secondary"></span>
            <div className="absolute bottom-0 left-0 z-30 w-full pb-5 pt-7.5">
              <ul className="flex items-center justify-center gap-8">
                <li>
                  <Link
                    aria-label="Team Social link for Facebook"
                    href={team.facebookLink}
                  >
                    <svg
                      className="fill-white duration-300 ease-in-out hover:fill-secondary"
                      width="10"
                      height="18"
                      viewBox="0 0 10 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.66634 10.25H8.74968L9.58301 6.91669H6.66634V5.25002C6.66634 4.39169 6.66634 3.58335 8.33301 3.58335H9.58301V0.783354C9.31134 0.74752 8.28551 0.666687 7.20218 0.666687C4.93968 0.666687 3.33301 2.04752 3.33301 4.58335V6.91669H0.833008V10.25H3.33301V17.3334H6.66634V10.25Z"
                        fill=""
                      />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link
                    aria-label="Team Social link for Twitter"
                    href={team.twitterLink}
                  >
                    <svg
                      className="fill-white duration-300 ease-in-out hover:fill-secondary"
                      width="18"
                      height="14"
                      viewBox="0 0 18 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.4683 1.71333C16.8321 1.99475 16.1574 2.17956 15.4666 2.26167C16.1947 1.82619 16.7397 1.14085 16.9999 0.333333C16.3166 0.74 15.5674 1.025 14.7866 1.17917C14.2621 0.617982 13.5669 0.245803 12.809 0.120487C12.0512 -0.00482822 11.2732 0.123742 10.596 0.486211C9.91875 0.848679 9.38024 1.42474 9.06418 2.12483C8.74812 2.82492 8.67221 3.60982 8.84825 4.3575C7.46251 4.28805 6.10686 3.92794 4.86933 3.30055C3.63179 2.67317 2.54003 1.79254 1.66492 0.715833C1.35516 1.24788 1.19238 1.85269 1.19326 2.46833C1.19326 3.67667 1.80826 4.74417 2.74326 5.36917C2.18993 5.35175 1.64878 5.20232 1.16492 4.93333V4.97667C1.16509 5.78142 1.44356 6.56135 1.95313 7.18422C2.46269 7.80709 3.17199 8.23456 3.96075 8.39417C3.4471 8.53337 2.90851 8.55388 2.38576 8.45417C2.60814 9.14686 3.04159 9.75267 3.62541 10.1868C4.20924 10.6209 4.9142 10.8615 5.64159 10.875C4.91866 11.4428 4.0909 11.8625 3.20566 12.1101C2.32041 12.3578 1.39503 12.4285 0.482422 12.3183C2.0755 13.3429 3.93 13.8868 5.82409 13.885C12.2349 13.885 15.7408 8.57417 15.7408 3.96833C15.7408 3.81833 15.7366 3.66667 15.7299 3.51833C16.4123 3.02514 17.0013 2.41418 17.4691 1.71417L17.4683 1.71333Z"
                        fill=""
                      />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link
                    aria-label="Team Social link for Linkedin"
                    href={team.linkedinLink}
                  >
                    <svg
                      className="fill-white duration-300 ease-in-out hover:fill-secondary"
                      width="17"
                      height="16"
                      viewBox="0 0 17 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.78353 2.16665C3.78331 2.60867 3.6075 3.03251 3.29478 3.34491C2.98207 3.65732 2.55806 3.8327 2.11603 3.83248C1.674 3.83226 1.25017 3.65645 0.937761 3.34373C0.625357 3.03102 0.449975 2.60701 0.450196 2.16498C0.450417 1.72295 0.626223 1.29912 0.93894 0.986712C1.25166 0.674307 1.67567 0.498925 2.1177 0.499146C2.55972 0.499367 2.98356 0.675173 3.29596 0.98789C3.60837 1.30061 3.78375 1.72462 3.78353 2.16665V2.16665ZM3.83353 5.06665H0.500195V15.5H3.83353V5.06665ZM9.1002 5.06665H5.78353V15.5H9.06686V10.025C9.06686 6.97498 13.0419 6.69165 13.0419 10.025V15.5H16.3335V8.89165C16.3335 3.74998 10.4502 3.94165 9.06686 6.46665L9.1002 5.06665V5.06665Z"
                        fill=""
                      />
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <h4 className="mb-1 mt-7.5 text-xl text-black dark:text-white md:text-title-sm">
          {team.name}
        </h4>
        <p>{team.position}</p>
      </div>
    </>
  );
}
