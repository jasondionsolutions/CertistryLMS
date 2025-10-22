// lib/auth/cognito.client.ts
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  ListUsersCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  type AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";

/**
 * AWS Cognito client for server-side user management operations
 *
 * This utility provides methods for:
 * - Creating users programmatically
 * - Updating user attributes (including custom:role)
 * - Deleting and disabling users
 * - Managing user groups
 * - Setting permanent passwords
 */

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION!,
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

/**
 * User creation input
 */
export interface CreateUserInput {
  username: string;
  email: string;
  name?: string;
  role?: "user" | "admin" | "instructor";
  temporaryPassword?: string;
  sendEmail?: boolean;
}

/**
 * Create a new user in Cognito
 */
export async function createCognitoUser(input: CreateUserInput) {
  const {
    username,
    email,
    name,
    role = "user",
    temporaryPassword,
    sendEmail = true,
  } = input;

  const userAttributes: AttributeType[] = [
    { Name: "email", Value: email },
    { Name: "email_verified", Value: "true" },
  ];

  if (name) {
    userAttributes.push({ Name: "name", Value: name });
  }

  // Add custom role attribute
  userAttributes.push({ Name: "custom:role", Value: role });

  const command = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username, // Use provided username instead of email
    UserAttributes: userAttributes,
    TemporaryPassword: temporaryPassword,
    MessageAction: sendEmail ? "RESEND" : "SUPPRESS",
    DesiredDeliveryMediums: sendEmail ? ["EMAIL"] : undefined,
  });

  try {
    const response = await cognitoClient.send(command);
    return {
      success: true,
      username: response.User?.Username,
      userSub: response.User?.Attributes?.find((attr) => attr.Name === "sub")
        ?.Value,
    };
  } catch (error) {
    console.error("Error creating Cognito user:", error);
    throw error;
  }
}

/**
 * Update user attributes (including custom:role)
 */
export async function updateCognitoUserAttributes(
  username: string,
  attributes: Record<string, string>
) {
  const userAttributes: AttributeType[] = Object.entries(attributes).map(
    ([key, value]) => ({
      Name: key,
      Value: value,
    })
  );

  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: userAttributes,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error updating Cognito user attributes:", error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateCognitoUserRole(
  username: string,
  role: "user" | "admin" | "instructor"
) {
  return updateCognitoUserAttributes(username, { "custom:role": role });
}

/**
 * Get user details from Cognito
 */
export async function getCognitoUser(username: string) {
  const command = new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });

  try {
    const response = await cognitoClient.send(command);

    // Parse attributes into a key-value object
    const attributes: Record<string, string> = {};
    response.UserAttributes?.forEach((attr) => {
      if (attr.Name && attr.Value) {
        attributes[attr.Name] = attr.Value;
      }
    });

    return {
      username: response.Username,
      enabled: response.Enabled,
      userStatus: response.UserStatus,
      createdAt: response.UserCreateDate,
      modifiedAt: response.UserLastModifiedDate,
      attributes,
    };
  } catch (error) {
    console.error("Error getting Cognito user:", error);
    throw error;
  }
}

/**
 * Set permanent password for user (skip temporary password flow)
 */
export async function setCognitoUserPassword(
  username: string,
  password: string,
  permanent: boolean = true
) {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: password,
    Permanent: permanent,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error setting Cognito user password:", error);
    throw error;
  }
}

/**
 * Disable user (soft delete - can be re-enabled)
 */
export async function disableCognitoUser(username: string) {
  const command = new AdminDisableUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error disabling Cognito user:", error);
    throw error;
  }
}

/**
 * Enable previously disabled user
 */
export async function enableCognitoUser(username: string) {
  const command = new AdminEnableUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error enabling Cognito user:", error);
    throw error;
  }
}

/**
 * Delete user permanently (cannot be undone)
 */
export async function deleteCognitoUser(username: string) {
  const command = new AdminDeleteUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting Cognito user:", error);
    throw error;
  }
}

/**
 * List all users in the User Pool
 */
export async function listCognitoUsers(limit: number = 60) {
  const command = new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Limit: limit,
  });

  try {
    const response = await cognitoClient.send(command);

    return {
      users: response.Users?.map((user) => {
        const attributes: Record<string, string> = {};
        user.Attributes?.forEach((attr) => {
          if (attr.Name && attr.Value) {
            attributes[attr.Name] = attr.Value;
          }
        });

        return {
          username: user.Username,
          enabled: user.Enabled,
          userStatus: user.UserStatus,
          createdAt: user.UserCreateDate,
          modifiedAt: user.UserLastModifiedDate,
          attributes,
        };
      }),
      paginationToken: response.PaginationToken,
    };
  } catch (error) {
    console.error("Error listing Cognito users:", error);
    throw error;
  }
}

/**
 * Add user to a Cognito group
 * Note: Groups must be created in Cognito console first
 */
export async function addUserToGroup(username: string, groupName: string) {
  const command = new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: groupName,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

/**
 * Remove user from a Cognito group
 */
export async function removeUserFromGroup(username: string, groupName: string) {
  const command = new AdminRemoveUserFromGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: groupName,
  });

  try {
    await cognitoClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error removing user from group:", error);
    throw error;
  }
}
