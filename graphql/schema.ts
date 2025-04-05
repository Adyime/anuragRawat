import { gql } from "@apollo/client";

export const typeDefs = gql`
  enum Role {
    USER
    ADMIN
  }

  enum Language {
    ENGLISH
    HINDI
    GUJARATI
  }

  enum OrderStatus {
    PENDING
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum PaymentMethod {
    CASH_ON_DELIVERY
    ONLINE
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
  }

  enum SortOrder {
    newest
    price_asc
    price_desc
  }

  type Query {
    me: User
    products(
      search: String
      category: String
      language: Language
      minPrice: Float
      maxPrice: Float
      isEbook: Boolean
      sort: SortOrder
    ): [Product!]!
    product(id: ID!): Product
    categories: [Category!]!
    category(id: ID!): Category
    userOrders: [Order!]!
    order(id: ID!): Order
    userAddresses: [Address!]!
    coupons: [Coupon!]!
    validateCoupon(code: String!, total: Float!): Coupon
    customers: [User!]!
    orders: [Order!]!
    totalRevenue: Float!
    totalOrders: Int!
    totalProducts: Int!
    totalCustomers: Int!
    recentOrders: [Order!]!
    salesOverview: [SaleData!]!
    analytics: Analytics!
    bestsellers: [Product!]!
    cart: Cart
    myEbooks: [OrderItem!]!
  }

  type User {
    id: ID!
    name: String
    email: String!
    image: String
    role: Role!
    createdAt: String!
    orders: [Order!]!
    addresses: [Address!]!
    reviews: [Review!]!
  }

  type Address {
    id: ID!
    name: String!
    phone: String!
    address: String!
    city: String!
    state: String!
    pincode: String!
    isDefault: Boolean!
  }

  type Product {
    id: ID!
    title: String!
    description: String!
    price: Float!
    discountedPrice: Float
    isEbook: Boolean!
    ebookPrice: Float
    ebookDiscounted: Float
    isFree: Boolean!
    language: Language!
    stock: Int!
    images: [String!]!
    pdfUrl: String
    category: Category!
    subcategory: Subcategory
    relatedProducts: [Product!]!
    reviews: [Review!]!
  }

  type Category {
    id: ID!
    name: String!
    description: String
    subcategories: [Subcategory!]!
    products: [Product!]!
  }

  type Subcategory {
    id: ID!
    name: String!
    description: String
    category: Category!
    products: [Product!]!
  }

  type Order {
    id: ID!
    total: Float!
    status: OrderStatus!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    address: String!
    createdAt: String!
    user: User!
    items: [OrderItem!]!
    coupon: Coupon
    shipmentDetails: ShipmentDetails
  }

  type ShipmentDetails {
    trackingId: String
    provider: String
    status: String
    trackingUrl: String
    awbCode: String
    orderId: String
    courierName: String
    estimatedDelivery: String
    error: Boolean
    errorMessage: String
  }

  type OrderItem {
    id: ID!
    quantity: Int!
    price: Float!
    isEbook: Boolean!
    product: Product!
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String
    user: User!
    product: Product!
    createdAt: String!
  }

  type Coupon {
    id: ID!
    code: String!
    description: String
    discountPercent: Float!
    maxDiscount: Float!
    minOrderValue: Float!
    usageLimit: Int!
    usedCount: Int!
    startDate: String!
    endDate: String!
    isActive: Boolean!
    category: Category
  }

  type PaymentVerification {
    success: Boolean!
    message: String!
    orderId: ID
  }

  input ProductsInput {
    category: ID
    subcategory: ID
    search: String
    sort: String
    minPrice: Float
    maxPrice: Float
    language: Language
    isEbook: Boolean
  }

  input ProfileInput {
    name: String
    image: String
  }

  input AddressInput {
    name: String!
    phone: String!
    address: String!
    city: String!
    state: String!
    pincode: String!
    isDefault: Boolean
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
    isEbook: Boolean!
  }

  input OrderInput {
    items: [OrderItemInput!]!
    addressId: ID!
    paymentMethod: PaymentMethod!
    couponCode: String
  }

  input PaymentVerificationInput {
    orderId: ID!
    paymentId: String!
    signature: String!
  }

  input ReviewInput {
    productId: ID!
    rating: Int!
    comment: String
  }

  input ProductInput {
    title: String!
    description: String!
    price: Float!
    discountedPrice: Float
    isEbook: Boolean!
    ebookPrice: Float
    ebookDiscounted: Float
    isFree: Boolean!
    language: Language!
    stock: Int!
    images: [String!]!
    pdfUrl: String
    categoryId: ID!
    subcategoryId: ID
  }

  input CategoryInput {
    name: String!
    description: String
  }

  input SubcategoryInput {
    name: String!
    description: String
    categoryId: ID!
  }

  input CouponInput {
    code: String!
    description: String
    discountPercent: Float!
    maxDiscount: Float!
    minOrderValue: Float!
    usageLimit: Int!
    startDate: String!
    endDate: String!
    isActive: Boolean!
    categoryId: ID
  }

  type SaleData {
    date: String!
    revenue: Float!
  }

  type Analytics {
    revenue: AnalyticsData!
    orders: AnalyticsData!
    topProducts: [TopProduct!]!
    topCategories: [TopCategory!]!
  }

  type AnalyticsData {
    daily: [DataPoint!]!
    weekly: [DataPoint!]!
    monthly: [DataPoint!]!
  }

  type DataPoint {
    date: String!
    amount: Float!
    count: Int!
  }

  type TopProduct {
    id: ID!
    title: String!
    totalSales: Int!
    totalRevenue: Float!
  }

  type TopCategory {
    id: ID!
    name: String!
    totalSales: Int!
    totalRevenue: Float!
  }

  type Mutation {
    register(email: String!, password: String!, name: String): User!
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!

    createReview(input: ReviewInput!): Review!
    updateReview(id: ID!, input: ReviewInput!): Review!
    deleteReview(id: ID!): Boolean!

    createOrder(input: OrderInput!): Order!
    cancelOrder(id: ID!): Order!
    verifyPayment(input: PaymentVerificationInput!): PaymentVerification!

    createAddress(input: AddressInput!): Address!
    updateAddress(id: ID!, input: AddressInput!): Address!
    deleteAddress(id: ID!): Boolean!

    updateProfile(input: ProfileInput!): User!

    createCategory(input: CategoryInput!): Category!
    updateCategory(id: ID!, input: CategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    createSubcategory(input: SubcategoryInput!): Subcategory!
    updateSubcategory(id: ID!, input: SubcategoryInput!): Subcategory!
    deleteSubcategory(id: ID!): Boolean!

    createCoupon(input: CouponInput!): Coupon!
    updateCoupon(id: ID!, input: CouponInput!): Coupon!
    deleteCoupon(id: ID!): Boolean!

    updateOrderStatus(id: ID!, status: OrderStatus!): Order!

    addToCart(input: CartItemInput!): Cart!
    updateCartItem(id: ID!, quantity: Int!): Cart!
    removeFromCart(id: ID!): Cart!
    clearCart: Boolean!
  }

  type Cart {
    id: ID!
    items: [CartItem!]!
    total: Float!
    user: User!
  }

  type CartItem {
    id: ID!
    quantity: Int!
    isEbook: Boolean!
    product: Product!
  }

  input CartItemInput {
    productId: ID!
    quantity: Int!
    isEbook: Boolean!
  }
`;
