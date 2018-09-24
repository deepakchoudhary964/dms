module.exports = {
    db: process.env.DB,
    mailer: {
        host: process.env.MAILER_HOST,
        port: process.env.MAILTER_PORT,
        secure: process.env.MAILTER_SECURE,
        auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASS
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'secret',
        algorithm: process.env.JWT_ALGORITHM || 'HS256'
    },
    google: {
        oauth2: {
            client_id: process.env.GOOGLE_OAUTH2_CLIENT_ID,
            secret: process.env.GOOGLE_OAUTH2_SECRET,
        }
    },
    stripe: {
      public_key: process.env.STRIPE_PUBLIC_KEY || "pk_test_yf6ckdL2qKtxb5PFzyxlLRLe",
      private_key: process.env.STRIPE_PRIVATE_KEY || "sk_test_vDWYM1MIxJjMW0dYp9T7M01u"
   }
};
