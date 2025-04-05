import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  ApolloLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { getSession } from "next-auth/react";

const httpLink = createHttpLink({
  uri: "/api/graphql",
});

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
            locations
          )}, Path: ${path}`
        );

        if (extensions) {
          console.error(`Error extensions:`, extensions);
        }
      });
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
      console.error(`Request operation: ${operation.operationName}`);
      console.error(`Request query: ${operation.query.loc?.source.body}`);
      console.error(
        `Request variables: ${JSON.stringify(operation.variables)}`
      );

      if ("result" in networkError) {
        console.error(`Network error details:`, networkError.result);
      }
      if ("statusCode" in networkError) {
        console.error(`Status code:`, networkError.statusCode);
      }
      if ("bodyText" in networkError) {
        console.error(`Response body:`, networkError.bodyText);
      }
    }

    return forward(operation);
  }
);

const authLink = setContext(async (_, { headers }) => {
  try {
    const session = await getSession();
    return {
      headers: {
        ...headers,
        authorization: session ? `Bearer ${session.user.id}` : "",
      },
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return {
      headers: {
        ...headers,
      },
    };
  }
});

const cleanTypenameLink = new ApolloLink((operation, forward) => {
  if (operation.variables) {
    const omitTypename = (key: string, value: any) =>
      key === "__typename" ? undefined : value;
    operation.variables = JSON.parse(
      JSON.stringify(operation.variables),
      omitTypename
    );
  }
  return forward(operation);
});

export const client = new ApolloClient({
  link: from([cleanTypenameLink, errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});
