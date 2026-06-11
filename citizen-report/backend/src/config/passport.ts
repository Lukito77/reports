import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: 'https://reports-cyan.vercel.app/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // აქ Google გაძლევს იუზერის ინფორმაციას profile-ში
        // profile.emails[0].value - არის მომხმარებლის იმეილი
        
        const userEmail = profile.emails?.[0].value;
        const displayName = profile.displayName;

        const user = {
          email: userEmail,
          name: displayName,
          googleId: profile.id,
        };

        // გადავცემთ იუზერს შემდეგ ნაბიჯზე
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;