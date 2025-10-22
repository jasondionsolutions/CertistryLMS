# AWS Cognito Setup Guide

This guide walks through setting up AWS Cognito User Pool via the AWS Management Console.

## Prerequisites

- AWS Account with appropriate permissions
- Access to AWS Console
- Application domain (for callback URLs)

## Step 1: Create User Pool

1. Navigate to **AWS Cognito** in the AWS Console
2. Click **"Create user pool"**

### Configure Sign-in Experience

**Step 1: Configure sign-in experience**

- **Authentication providers**: Choose **"Cognito user pool"**
- **Cognito user pool sign-in options**:
  - ✅ **Username** (check this - primary sign-in method)
  - ⬜ Email (leave unchecked as sign-in option)
  - ⬜ Phone number (leave unchecked)

**Username configuration**:
- ✅ **Allow users to use their email address as username** (RECOMMENDED - gives users flexibility)
  - Users can choose either a unique username (e.g., "john_doe") OR use their email as the username
  - Provides best user experience while allowing email changes later

- Click **"Next"**

### Configure Security Requirements

**Step 2: Configure security requirements**

**Password policy**:
- Select **"Custom"** for password policy mode
- Configure the following:
  - Minimum length: **8 characters**
  - ✅ Require lowercase letters
  - ✅ Require uppercase letters
  - ✅ Require numbers
  - ✅ Require symbols
  - Password expiry: **No expiration**

**Multi-factor authentication (MFA)**:
- Select **"Optional MFA"** (recommended)
- MFA methods:
  - ✅ **Authenticator apps** (TOTP)
  - ✅ **SMS** (optional - requires SNS configuration)

**User account recovery**:
- Select **"Email only"**

Click **"Next"**

### Configure Sign-up Experience

**Step 3: Configure sign-up experience**

**Self-service sign-up**:
- ✅ **Enable self-registration**

**Attribute verification and user account confirmation**:
- Select **"Send email message, verify email address"**
- Verifying attribute changes: ✅ **Keep original attribute value active when an update is pending**

**Required attributes**:
- ✅ **email** (required by default)
- ✅ **name** (add this)

**Custom attributes**:
Click **"Add custom attribute"**:
- **Attribute name**: `role`
- **Type**: String
- **Min length**: 1
- **Max length**: 50
- ⬜ Mutable (leave checked - users/admins can update)

Click **"Next"**

### Configure Message Delivery

**Step 4: Configure message delivery**

**Email**:
- Select **"Send email with Cognito"** (for development)
  - For production, select **"Send email with Amazon SES"** for better deliverability
- **FROM email address**: `noreply@verificationemail.com` (default)
- **REPLY-TO email address**: Your support email (e.g., `support@yourdomain.com`)

**SMS** (if using SMS MFA):
- IAM role: **Create a new IAM role** (recommended)
- Role name: `CognitoSNSRole`

Click **"Next"**

### Integrate Your App

**Step 5: Integrate your app**

**User pool name**:
- Name: `certistry-lms-production` (or `certistry-lms-dev`)

**Hosted authentication pages**:
- ⬜ **Use the Cognito Hosted UI** (leave unchecked - we'll use custom UI)

**Initial app client**:
- **App type**: Select **"Public client"**
- **App client name**: `certistry-web-app`
- **Client secret**: Select **"Don't generate a client secret"**
  - ⚠️ **Important**: Public clients (SPAs, mobile apps) should NOT have a client secret

**Advanced app client settings**:

**Authentication flows**:
- ✅ **ALLOW_USER_PASSWORD_AUTH** (username/password flow)
- ✅ **ALLOW_USER_SRP_AUTH** (Secure Remote Password - more secure)
- ✅ **ALLOW_REFRESH_TOKEN_AUTH** (required for token refresh)

**Authentication flow session duration**:
- **3 minutes** (default)

**Token expiration**:
- **Refresh token expiration**: 30 days
- **Access token expiration**: 60 minutes
- **ID token expiration**: 60 minutes

**Token revocation**:
- ✅ **Enable token revocation** (recommended)

Click **"Next"**

### Review and Create

**Step 6: Review and create**

- Review all configurations
- Click **"Create user pool"**

## Step 2: Configure App Client OAuth Settings

After creating the user pool:

1. Navigate to your User Pool
2. Go to **"App integration"** tab
3. Click on your app client name (`certistry-web-app`)
4. Click **"Edit"** in the **Hosted UI settings** section

### Configure OAuth Settings

**Allowed callback URLs**:
```
http://localhost:3000/api/auth/callback
http://localhost:3000/dashboard
https://yourdomain.com/api/auth/callback
https://yourdomain.com/dashboard
```

**Allowed sign-out URLs**:
```
http://localhost:3000
https://yourdomain.com
```

**OAuth 2.0 grant types**:
- ✅ **Authorization code grant**
- ⬜ Implicit grant (leave unchecked - less secure)

**OpenID Connect scopes**:
- ✅ **openid**
- ✅ **email**
- ✅ **profile**

Click **"Save changes"**

## Step 3: Configure Advanced Security (Optional)

1. In your User Pool, go to **"User pool properties"** tab
2. Find **"Advanced security"** section
3. Click **"Edit"**

**Advanced security**:
- Select **"Enforced mode"** (recommended for production)
  - This enables adaptive authentication and risk-based authentication
  - Detects compromised credentials and suspicious sign-in attempts
  - Requires AWS WAF for some features

Click **"Save changes"**

## Step 4: Collect Configuration Values

After setup, collect these values for your `.env` file:

1. **User Pool ID**:
   - Go to **"User pool overview"**
   - Copy the **User pool ID** (format: `us-east-1_XXXXXXXXX`)

2. **App Client ID**:
   - Go to **"App integration"** tab
   - Click on your app client
   - Copy the **Client ID** (format: long alphanumeric string)

3. **AWS Region**:
   - Note the region where you created the pool (e.g., `us-east-1`)

4. **User Pool Domain** (if using Hosted UI):
   - Go to **"App integration"** tab
   - Under **"Domain"**, click **"Actions"** → **"Create Cognito domain"**
   - Enter a domain prefix (e.g., `certistry-lms-dev`)
   - Copy the full domain (e.g., `https://certistry-lms-dev.auth.us-east-1.amazoncognito.com`)

## Step 5: Configure Environment Variables

Add these values to your `.env.local` and `.env` files:

```bash
# AWS Cognito Configuration
AWS_REGION="us-east-1"
COGNITO_USER_POOL_ID="us-east-1_XXXXXXXXX"
COGNITO_CLIENT_ID="your-client-id-here"

# Optional: If using Hosted UI
COGNITO_DOMAIN="https://your-domain.auth.us-east-1.amazoncognito.com"

# NextAuth Configuration (for session management)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Step 6: Test User Pool

### Create Test User (via Console)

1. Go to your User Pool
2. Click **"Users"** tab
3. Click **"Create user"**

**User information**:
- **Username**: `testuser` (or use email format like `test@example.com` if you enabled email as username)
- **Email address**: `test@example.com`
- **Email verified**: ✅ Mark as verified
- **Temporary password**: Create a secure password (must meet password policy)
- ✅ **Send an email invitation** (optional)

**Custom attributes**:
- **custom:role**: `user` (or `admin` for admin users)

Click **"Create user"**

**Note**: Since we're using username-based authentication:
- Users sign in with their **username**, not email
- Users can change their email address later
- Username is permanent once created

### Test Sign-In

You can test authentication using:
1. **AWS Cognito Hosted UI** (if configured)
2. **Your application** (after integration is complete)
3. **AWS CLI** (for testing):

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=test@example.com,PASSWORD=YourPassword123! \
  --region us-east-1
```

## Common Configuration Notes

### Production Checklist

- [ ] Use Amazon SES for email delivery (better deliverability)
- [ ] Enable Advanced Security (enforced mode)
- [ ] Configure MFA (at least optional)
- [ ] Set up custom email templates
- [ ] Configure account takeover protection
- [ ] Set up CloudWatch alarms for failed sign-ins
- [ ] Enable deletion protection on User Pool
- [ ] Use custom domain for Hosted UI (if using)

### User Roles

The `custom:role` attribute can have these values:
- `user` - Regular student users
- `admin` - System administrators
- `instructor` - Content creators/instructors

**Setting roles**:
1. Go to **Users** tab
2. Click on a user
3. Scroll to **"User attributes"**
4. Click **"Edit"**
5. Add/update `custom:role` attribute

### Password Requirements

Based on our configuration:
- Minimum 8 characters
- At least 1 lowercase letter
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

## Troubleshooting

### "User is not confirmed" error
- Verify email address in user attributes
- Check email verification status
- Manually confirm user via Console if needed

### "Invalid OAuth redirect_uri" error
- Check callback URLs in app client settings
- Ensure URLs match exactly (including http/https)
- Check for trailing slashes

### Email delivery issues
- Verify FROM email address
- Check SES configuration (if using SES)
- Check spam folder
- For production, move from Cognito email to SES

### MFA issues
- Ensure user has enrolled in MFA
- Check SMS configuration (if using SMS MFA)
- Verify SNS permissions for SMS delivery

## Next Steps

After completing this setup:

1. ✅ Update `.env` and `.env.local` with Cognito credentials
2. ✅ Install AWS SDK dependencies
3. ✅ Implement authentication integration in Next.js
4. ✅ Update `validateSession()` to use real Cognito tokens
5. ✅ Test sign-up, sign-in, and sign-out flows

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [Cognito User Pool Settings Reference](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings.html)
- [OAuth 2.0 Flows](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
- [NextAuth.js Cognito Provider](https://next-auth.js.org/providers/cognito)
