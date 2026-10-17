export interface MenuItemModel {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string | null;
  description?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfferModel {
  id: string;
  title: string;
  description: string;
  discount: string;
  couponCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  offerType: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingItemModel {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface BookingModel {
  id: string;
  bookingId: string;
  purpose: string;
  customPurpose?: string;
  date: string;
  time: string;
  guests: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  specialRequirements?: {
    decoration?: boolean;
    cakeArrangement?: boolean;
    specialTableSetup?: boolean;
    additionalRequest?: string;
  };
  selectedItems: BookingItemModel[];
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  bookingStatus: 'Payment Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentModel {
  id: string;
  paymentReference: string;
  bookingId?: string | null;
  orderId?: string | null;
  customerName: string;
  customerPhone: string;
  type: 'Booking Advance' | 'Food Delivery' | 'Dining Remaining';
  amount: number;
  status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  method?: string;
  createdAt: string;
}

export interface AdminUserModel {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  menuItems: MenuItemModel[];
  offers: OfferModel[];
  bookings: BookingModel[];
  payments: PaymentModel[];
  adminUsers: AdminUserModel[];
}
