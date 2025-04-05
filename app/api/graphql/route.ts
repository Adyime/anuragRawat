import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Create Apollo Server with better error handling
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError, error) => {
    console.error("GraphQL Error:", formattedError);
    console.error("Original error:", error);

    // Return detailed error information in development
    return process.env.NODE_ENV === "production"
      ? { message: formattedError.message }
      : {
          message: formattedError.message,
          locations: formattedError.locations,
          path: formattedError.path,
          extensions: formattedError.extensions,
        };
  },
});

// Handler with improved error handling
const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    try {
      console.log("GraphQL API called. Authenticating...");

      // Get token from NextAuth
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });

      let user = null;

      if (token?.sub) {
        console.log("User authenticated with ID:", token.sub);
        // Fetch the user from the database
        user = await prisma.user.findUnique({
          where: { id: token.sub },
        });

        if (!user) {
          console.error(
            "User not found in database despite valid token:",
            token.sub
          );
        } else {
          console.log("User successfully authenticated:", user.email);
        }
      } else {
        console.log("No authentication token found or invalid token");
      }

      // Always return prisma in context even if user is null
      return {
        user,
        prisma,
        // Include token info for debugging
        auth: token
          ? {
              isAuthenticated: !!user,
              tokenExists: !!token,
            }
          : null,
      };
    } catch (error) {
      console.error("Error in GraphQL context:", error);
      // Return null user but still provide prisma
      return {
        user: null,
        prisma,
        authError: true,
      };
    }
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  console.log("🚀 GraphQL POST request received");
  
  // Log verifyPayment mutation requests to help diagnose the issue
  try {
    // Clone the request to read its body
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();
    
    if (body && body.query && body.query.includes('verifyPayment')) {
      console.log("⭐⭐⭐ VERIFY PAYMENT MUTATION DETECTED ⭐⭐⭐");
      console.log("Request body:", JSON.stringify(body, null, 2));
      
      if (body.variables && body.variables.input) {
        console.log("Payment verification input:", JSON.stringify(body.variables.input, null, 2));
      }
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
  }
  
  return handler(request);
}
