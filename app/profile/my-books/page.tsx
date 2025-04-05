"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Download, Loader2 } from "lucide-react";
import { client } from "@/lib/apollo-client";
import { gql } from "@apollo/client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// Define types for the ebook data
interface EbookProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  pdfUrl?: string;
}

interface Ebook {
  id: string;
  product: EbookProduct;
  price: number;
  isEbook: boolean;
}

const GET_MY_EBOOKS = gql`
  query GetMyEbooks {
    myEbooks {
      id
      product {
        id
        title
        description
        images
        pdfUrl
      }
      price
      isEbook
    }
  }
`;

export default function MyBooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }

    // Fetch e-books
    if (status === "authenticated") {
      fetchEbooks();
    }
  }, [status, router]);

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      const { data } = await client.query({
        query: GET_MY_EBOOKS,
        fetchPolicy: "network-only", // Don't use cache
      });
      setEbooks(data.myEbooks || []);
    } catch (err: any) {
      console.error("Error fetching e-books:", err);
      setError(err.message || "Failed to load e-books");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#f26522]" />
          <p className="text-[#0a0a8c] font-medium">Loading your e-books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-100 rounded-lg p-6 text-center">
          <p className="text-red-500 mb-4">Failed to load your e-books</p>
          <Button onClick={fetchEbooks} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#0a0a8c] mb-8">
        <BookOpen className="inline-block mr-2 h-8 w-8 text-[#f26522]" />
        My E-Books
      </h1>

      {ebooks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-12 text-center">
          <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-medium text-gray-500 mb-2">
            No e-books yet
          </h2>
          <p className="text-gray-400 mb-6">
            Purchase e-books to see them here
          </p>
          <Link href="/ebooks">
            <Button>Browse E-Books</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks.map((ebook) => (
            <div
              key={ebook.id}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[3/4] w-full relative overflow-hidden bg-gray-100">
                <Image
                  src={
                    ebook.product.images[0] ||
                    "https://via.placeholder.com/300x400?text=No+Image"
                  }
                  alt={ebook.product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {ebook.product.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {ebook.product.description}
                </p>
                <div className="flex justify-end">
                  {ebook.product.pdfUrl && (
                    <a
                      href={ebook.product.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#0a0a8c] hover:text-[#f26522]"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
