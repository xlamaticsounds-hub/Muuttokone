import { withAuth } from "next-auth/middleware";

export default withAuth({
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
    },
  },
  callbacks: {
    authorized: ({ token, req }) => {
      // Only allowed emails can access admin or AI generation tools
      const allowedEmails = (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase());
      
      const userEmail = token?.email?.toLowerCase();
      
      if (!userEmail) return false;

      // Check if user is in the allowlist
      const isAllowed = 
        userEmail === 'xlamaticsounds@gmail.com' ||
        userEmail === 'domenic.eklund@gmail.com' ||
        allowedEmails.includes(userEmail);

      return isAllowed;
    },
  },
});

export const config = {
  matcher: ["/hallinta/:path*", "/api/ai/:path*"],
};