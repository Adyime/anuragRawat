"use client";

import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

import { columns } from "@/components/admin/reviews/columns";
import { DataTable } from "@/components/admin/products/data-table";

const GET_REVIEWS = gql`
  query GetReviews {
    reviews {
      id
      rating
      comment
      isApproved
      createdAt
      user {
        id
        name
        email
      }
      product {
        id
        title
        images
      }
    }
  }
`;

export default function ReviewsPage() {
  const { data, loading } = useQuery(GET_REVIEWS);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
        <p className="text-muted-foreground">Manage product reviews</p>
      </div>

      <DataTable columns={columns} data={data?.reviews || []} />
    </div>
  );
}
