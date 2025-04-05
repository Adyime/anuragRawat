import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";

interface Context {
  user?: {
    id: string;
    email: string;
  } | null;
  prisma: typeof prisma;
}

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error("GraphQL Error:", error);
    return error;
  },
});

export default startServerAndCreateNextHandler(server, {
  context: async (req) => {
    try {
      const token = await getToken({ req });
      let user = null;

      if (token?.sub) {
        user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            email: true,
          },
        });
      }

      return { user, prisma };
    } catch (error) {
      console.error("Error creating context:", error);
      // Return a context without user for public routes
      return { prisma };
    }
  },
});
