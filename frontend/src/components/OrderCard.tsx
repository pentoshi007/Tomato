import { BiMapPin, BiPackage, BiTimeFive } from "react-icons/bi";
import type { IOrder } from "../types";

type OrderCardProps = {
  order: IOrder;
  statusLabel: string;
};

const OrderCard = ({ order, statusLabel }: OrderCardProps) => {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-semibold text-slate-900">
            {order._id}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <BiMapPin className="h-4 w-4 shrink-0 text-[#E23744]" />
            <span className="truncate">{order.deliveryAddress.formattedAddress}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#E23744]">
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1">
          <BiTimeFive className="h-3.5 w-3.5 text-[#E23744]" />
          {new Date(order.createdAt).toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1">
          <BiPackage className="h-3.5 w-3.5 text-[#E23744]" />
          {order.items.length} item
          {order.items.length !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-700">
          ₹{order.totalAmount}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium capitalize ${
            order.paymentStatus === "paid"
              ? "bg-emerald-50 text-emerald-700"
              : order.paymentStatus === "failed"
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          {order.paymentMethod} · {order.paymentStatus}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {order.items.slice(0, 3).map((item) => (
          <span
            key={item.itemId}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700"
          >
            {item.quantity}× {item.name}
          </span>
        ))}
        {order.items.length > 3 && (
          <span className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-400">
            +{order.items.length - 3} more
          </span>
        )}
      </div>
    </article>
  );
};

export default OrderCard;