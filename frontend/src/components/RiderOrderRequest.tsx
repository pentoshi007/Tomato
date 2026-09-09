import axios from "axios";
import { useState, useEffect } from "react";
import { riderService } from "../config";
import { toast } from "react-hot-toast";
import { BiSolidZap } from "react-icons/bi";
interface Props {
  orderId: string;
  onAccepted: () => void;
}

const RiderOrderRequest = ({ orderId, onAccepted }: Props) => {
  const [accepting, setAccepting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAccepted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onAccepted]);

  const acceptOrder = async () => {
    setAccepting(true);
    try {
      await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Order accepted successfully");
      onAccepted();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to accept order"
        : "Failed to accept order";
      toast.error(message);
      console.error(error);
      onAccepted();
    } finally {
      setAccepting(false);
    }
  };
  const urgent = secondsLeft <= 3;
  return (
    <div className="rounded-[28px] border border-[#f7d0dc] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7fa] text-[#E23774] ring-1 ring-[#f7d0dc]">
            <BiSolidZap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              New delivery request
            </p>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">
              Order #{orderId.slice(-6)}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {secondsLeft}s left
        </span>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            urgent ? "bg-red-500" : "bg-[#E23774]"
          }`}
          style={{ width: `${secondsLeft * 10}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Accept within {secondsLeft} seconds to claim this delivery.
      </p>

      <button
        type="button"
        disabled={accepting}
        onClick={acceptOrder}
        className="mt-5 w-full rounded-xl bg-[#E23774] py-3 text-sm font-semibold text-white transition hover:bg-[#d91f66] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {accepting ? "Accepting..." : "Accept Order"}
      </button>
    </div>
  );
};

export default RiderOrderRequest;
