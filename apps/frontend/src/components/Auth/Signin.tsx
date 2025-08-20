"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import validateEmail from "@/app/libs/validate";
import Graphics from "@/components/Auth/Graphics";
import SlideOnReveal from "@/components/SlideOnReveal";
import z from "zod";
import { integrations, messages } from "../../../integrations.config";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8)
    .refine(
      (val) =>
        /[A-Z]/.test(val) && // At least one uppercase letter
        /[a-z]/.test(val) && // At least one lowercase letter
        /\d/.test(val) && // At least one number
        /[@$!%*?&]/.test(val), // At least one special character
      {
        message:
          "Password must be at least 8 characters long and contain uppercase and lowercase letters, a number, and a special character.",
      },
    ),
});

const Signin = () => {
  const [isPassword, setIsPassword] = useState(false);
  const [data, setData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const validateForm = (isEmail: boolean) => {
    const result = schema.safeParse(data);

    if (!result.success) {
      if (isEmail) {
        toast.error(result.error.errors[0].message);
        return false;
      } else {
        result.error.errors.forEach((error) => {
          toast.error(error.message);
        });
        return false;
      }
    }
    return true;
  };

  const loginUser = async (e: any) => {
    e.preventDefault();

    if (!integrations.isAuthEnabled) {
      toast.error(messages.auth);
      return;
    }

    if (!validateForm(false)) {
      return;
    }

    signIn("credentials", { ...data, redirect: false }).then((callback) => {
      if (callback?.error) {
        toast.error(callback.error);
      }

      if (callback?.ok && !callback?.error) {
        toast.success("Logged in successfully");
        setData({ email: "", password: "", remember: false });
      }
    });
  };

  const signinWithMail = () => {
    if (!integrations.isAuthEnabled) {
      toast.error(messages.auth);
      return;
    }

    if (!validateForm(true)) {
      return;
    }

    if (!validateEmail(data.email)) {
      return toast.error("Please enter a valid email address.");
    } else {
      signIn("email", {
        redirect: false,
        email: data?.email,
      })
        .then((callback) => {
          if (callback?.ok) {
            toast.success("Email sent");
            setData({ ...data, email: "" });
          }
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };
  return (
    <>
      {/* <!-- ===== SignIn Form Start ===== --> */}
      <section className="bg-whiter dark:bg-blacksection relative overflow-hidden px-4 pt-35 pb-20 md:px-8 lg:pt-45 lg:pb-25 xl:px-0 xl:pt-50 xl:pb-30">
        <SlideOnReveal delay={0.3}>
          <div className="animate_top shadow-3 relative z-10 mx-auto max-w-550 rounded-lg bg-white px-7.5 py-9 md:px-12.5 md:py-11.5 lg:px-17.5 lg:py-16.5 dark:bg-black dark:shadow-none">
            <span className="bg-primary absolute top-0 left-0 block h-1.5 w-1/2 rounded-tl-lg"></span>
            <span className="bg-secondary absolute top-0 right-0 block h-1.5 w-1/2 rounded-tr-lg"></span>

            <div className="text-center">
              <h2 className="text-title-lg2 mb-2.5 font-medium text-black dark:text-white">
                Sign in to your Account
              </h2>
              <p>Lorem ipsum dolor sit amet, consectetur</p>

              <h3 className="mt-7.5 mb-5.5 text-xl font-light text-black dark:text-white">
                Sign in with Social Media
              </h3>

              <ul className="mb-9 flex items-center justify-center gap-4.5">
                <li>
                  <Link
                    href="#"
                    aria-label="sign with google"
                    onClick={() => signIn("google")}
                    className="border-strokedark hover:border-primary/40 hover:shadow-5 dark:border-blacksection dark:hover:border-primary/40 flex h-12.5 w-12.5 items-center justify-center rounded-lg border p-3.5 duration-300 ease-in-out"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_50_914)">
                        <path
                          d="M22.0001 11.2439C22.0134 10.4877 21.9338 9.73268 21.7629 8.99512H11.2246V13.0773H17.4105C17.2933 13.793 17.0296 14.4782 16.6352 15.0915C16.2409 15.7048 15.724 16.2336 15.1158 16.6461L15.0942 16.7828L18.4264 19.3125L18.6571 19.3351C20.7772 17.4162 21.9997 14.5928 21.9997 11.2439"
                          fill="#4285F4"
                        />
                        <path
                          d="M11.2245 22C14.255 22 16.7992 21.0222 18.6577 19.3355L15.1156 16.6465C14.1679 17.2945 12.8958 17.7467 11.2245 17.7467C9.80508 17.7386 8.42433 17.2926 7.27814 16.4721C6.13195 15.6516 5.27851 14.4982 4.83892 13.1755L4.70737 13.1865L1.24255 15.8143L1.19727 15.9377C2.13043 17.7603 3.56252 19.2925 5.33341 20.3631C7.10429 21.4338 9.14416 22.0005 11.2249 22"
                          fill="#34A853"
                        />
                        <path
                          d="M4.83889 13.1756C4.59338 12.4754 4.46669 11.7405 4.46388 11.0001C4.4684 10.2609 4.59041 9.52697 4.82552 8.82462L4.81927 8.6788L1.31196 6.00879L1.19724 6.06226C0.410039 7.59392 0 9.28503 0 11C0 12.715 0.410039 14.4061 1.19724 15.9377L4.83889 13.1756"
                          fill="#FBBC05"
                        />
                        <path
                          d="M11.2249 4.25337C12.8333 4.22889 14.3888 4.8159 15.565 5.89121L18.7329 2.86003C16.7011 0.992106 14.0106 -0.0328008 11.2249 3.27798e-05C9.14418 -0.000452376 7.10433 0.566279 5.33345 1.63686C3.56256 2.70743 2.13046 4.23965 1.19727 6.06218L4.82684 8.82455C5.27077 7.50213 6.12703 6.34962 7.27491 5.5295C8.4228 4.70938 9.80439 4.26302 11.2249 4.25337"
                          fill="#EB4335"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_50_914">
                          <rect width="22" height="22" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    aria-label="signup with github"
                    onClick={() => signIn("github")}
                    className="border-strokedark hover:border-primary/40 hover:shadow-5 dark:border-blacksection dark:hover:border-primary/40 flex h-12.5 w-12.5 items-center justify-center rounded-lg border p-3.5 duration-300 ease-in-out"
                  >
                    <svg
                      width="23"
                      height="22"
                      viewBox="0 0 23 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.2731 0C9.7927 0 8.32679 0.291587 6.95907 0.858113C5.59136 1.42464 4.34862 2.25501 3.30182 3.30181C1.1877 5.41593 0 8.28329 0 11.2731C0 16.2558 3.23538 20.4832 7.7108 21.9825C8.27446 22.0727 8.45483 21.7233 8.45483 21.4189C8.45483 21.1596 8.45483 20.4494 8.45483 19.5137C5.33218 20.1901 4.66706 18.0031 4.66706 18.0031C4.1485 16.6955 3.41575 16.346 3.41575 16.346C2.3899 15.6471 3.49466 15.6696 3.49466 15.6696C4.62197 15.7485 5.21945 16.8307 5.21945 16.8307C6.20021 18.5442 7.85735 18.037 8.49992 17.7664C8.60138 17.0336 8.89448 16.5376 9.21013 16.2558C6.7075 15.974 4.08086 15.0045 4.08086 10.7094C4.08086 9.45813 4.50924 8.45482 5.24199 7.65443C5.12926 7.37261 4.7347 6.2002 5.35472 4.67834C5.35472 4.67834 6.30167 4.37396 8.45483 5.82819C9.3454 5.58018 10.3149 5.45618 11.2731 5.45618C12.2313 5.45618 13.2008 5.58018 14.0914 5.82819C16.2445 4.37396 17.1915 4.67834 17.1915 4.67834C17.8115 6.2002 17.4169 7.37261 17.3042 7.65443C18.037 8.45482 18.4653 9.45813 18.4653 10.7094C18.4653 15.0158 15.8274 15.9627 13.3135 16.2445C13.7194 16.594 14.0914 17.2817 14.0914 18.3301C14.0914 19.8407 14.0914 21.0581 14.0914 21.4189C14.0914 21.7233 14.2717 22.084 14.8467 21.9825C19.3221 20.4719 22.5462 16.2558 22.5462 11.2731C22.5462 9.79269 22.2546 8.32678 21.6881 6.95907C21.1216 5.59135 20.2912 4.34862 19.2444 3.30181C18.1976 2.25501 16.9549 1.42464 15.5871 0.858113C14.2194 0.291587 12.7535 0 11.2731 0Z"
                        fill="#79808A"
                      />
                    </svg>
                  </Link>
                </li>
              </ul>

              <span className="font-outfit relative block text-lg font-light">
                <span className="bg-strokedark dark:bg-stroke absolute top-1/2 left-0 block h-[1px] w-22.5"></span>
                <span className="bg-strokedark dark:bg-stroke absolute top-1/2 right-0 block h-[1px] w-22.5"></span>
                Or, sign up with your email
              </span>
            </div>

            <div className="border-strokedark dark:border-stroke mx-auto mt-9 mb-12 flex flex-col items-center justify-center gap-1 rounded-lg border p-1 md:flex-row">
              <button
                className={`text-body hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary w-full rounded-lg px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:hover:shadow-none ${
                  !isPassword &&
                  "bg-primary/5 text-primary dark:border-primary dark:bg-primary/5 border"
                }`}
                onClick={() => setIsPassword(false)}
              >
                Magic Link
              </button>
              <button
                className={`text-body hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary w-full rounded-lg px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:text-white dark:hover:shadow-none ${
                  isPassword &&
                  "bg-primary/5 text-primary dark:border-primary dark:bg-primary/5 border"
                }`}
                onClick={() => setIsPassword(true)}
              >
                Password
              </button>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className={`${!isPassword ? "" : "hidden"}`}
            >
              <div>
                <input
                  type="email"
                  value={data?.email}
                  placeholder="Email"
                  className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-4 dark:border-stroke dark:focus:border-primary/40 w-full rounded-full border bg-white px-6 py-3.5 focus-visible:outline-hidden dark:bg-black dark:shadow-none"
                  required
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />

                <div className="mt-6">
                  <button
                    aria-label="login with email and password"
                    className={`bg-primary hover:shadow-1 block w-full rounded-full px-7.5 py-3 text-center font-medium text-white duration-300 ease-in-out`}
                    onClick={signinWithMail}
                  >
                    Send Magic Link
                  </button>
                </div>
              </div>
            </form>

            <form
              onSubmit={loginUser}
              className={`${isPassword ? "" : "hidden"}`}
            >
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="mb-3 block text-black dark:text-white"
                >
                  Work Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  // required
                  className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-4 dark:border-stroke dark:focus:border-primary/40 w-full rounded-full border bg-white px-6 py-3.5 focus-visible:outline-hidden dark:bg-black dark:shadow-none"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="mb-3 block text-black dark:text-white"
                >
                  Your password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                  className="border-strokedark shadow-4 placeholder:text-body/50 focus:border-primary focus:shadow-4 dark:border-stroke dark:focus:border-primary/40 w-full rounded-full border bg-white px-6 py-3.5 focus-visible:outline-hidden dark:bg-black dark:shadow-none"
                />
              </div>

              <div className="mb-8 flex items-center justify-between">
                <div>
                  <label
                    htmlFor="checkboxLabel"
                    className="text-body-color-2 dark:text-body-color flex cursor-pointer items-center text-sm font-medium select-none"
                  >
                    <input
                      type="checkbox"
                      name="checkboxLabel"
                      id="checkboxLabel"
                      className="sr-only"
                      onChange={(e) =>
                        setData({ ...data, remember: e.target.checked })
                      }
                    />
                    <div className="border-body/30 mr-4 flex h-5 w-5 items-center justify-center rounded-sm border dark:border-white/10">
                      {data?.remember && (
                        <span>
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                              fill="#3056D3"
                              stroke="#3056D3"
                              strokeWidth="0.4"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    Keep me signed in
                  </label>
                </div>

                <div>
                  <Link
                    href="/auth/forget-password"
                    aria-label="forgot password"
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                aria-label="login with email and password"
                className="bg-primary hover:shadow-1 block w-full rounded-full px-7.5 py-3 text-center font-medium text-white duration-300 ease-in-out"
              >
                Sign In
              </button>

              <p className="font-outfit mt-7.5 text-center text-lg font-light">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-primary">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </SlideOnReveal>
        <Graphics />
      </section>
      {/* <!-- ===== SignIn Form End ===== --> */}
    </>
  );
};

export default Signin;
