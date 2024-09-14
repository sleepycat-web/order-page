export interface OrderItem {
  item: {
    name: string;
    price: string;
    customizationOptions: Array<{
      name: string;
      type: string;
      options: Array<{
        label: string;
        price: string;
      }>;
    }>;
  };
  selectedOptions: {
    [key: string]: string[];
  };
  quantity: number;
  specialRequests: string;
  totalPrice: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  selectedLocation: string;
  selectedCabin: string;
  total: number;
  appliedPromo?: {
    code: string;
    percentage: number;
  };
  phoneNumber: string;
  customerName: string;
  status: string;
  order: string;
  createdAt: string;
  updatedAt?: string;
  dispatchedAt?: string;
  fulfilledAt?: string;
    tableDeliveryCharge?: number;
    
}

export interface CompactInfoProps {
  customerName: string;
  phoneNumber: string;
  cabin: string;
  total: number;
  orders: {
    _id: string;
    order: string;
    status: string;
    price: number;
    tableDeliveryCharge?: number; // Added this line
  }[];
  onDispatchAll: (orderIds: string[]) => void;
  onFulfillAll: (orderIds: string[]) => void;
  onRejectAll: (orderIds: string[]) => Promise<void>;
  activeTab: "new" | "active" | "previous"; // Add this line
  onToggle: (isExpanded: boolean) => void;
  initialExpanded: boolean; // Add this prop
}

export interface OrderItemProps {
  item: {
    name: string;
    totalPrice: number;
    quantity: number;
    selectedOptions: { [key: string]: string[] };
    specialRequests?: string;
  };
}

 export interface OrderComponentProps {
  order: Order;
  onDispatch: (orderId: string) => void;
  onPayment: (orderId: string) => void;
}

// import { Order,OrderItems,OrderComponentProps, } from "@/scripts/interface";
