import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'https://reports-cyan.vercel.app/api/auth/google/callback';

// Google sign-in is optional. passport-oauth2 throws at construction time if the
// clientID is empty, so only register the strategy when credentials are present
// (otherwise local/dev boots would crash). Routes check `googleEnabled`.
export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // აქ Google გაძლევს იუზერის ინფორმაციას profile-ში
        // profile.emails[0].value - არის მომხმარებლის იმეილი

        const userEmail = profile.emails?.[0].value;
        const displayName = profile.displayName;

        if (!userEmail) {
          return done(new Error('Google account did not return an email address'), undefined);
        }

        const user = {
          email: userEmail,
          name: displayName,
          googleId: profile.id,
        };

        // გადავცემთ იუზერს შემდეგ ნაბიჯზე.
        // Express.User აქ ჯერ კიდევ Google-ის პროფილია და არა ჩვენი AuthUser,
        // ამიტომ cast გვჭირდება — კონტროლერი თავად გადააქცევს ნამდვილ იუზერად.
        return done(null, user as unknown as Express.User);
      } catch (error) {
        return done(error as Error, undefined);
      }
    },
    ),
  );
}

export default passport;
