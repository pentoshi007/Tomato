import axios from "axios";
import { useState, useEffect } from "react";
import { riderService } from "../config";
import { toast } from "react-hot-toast";
import { BiSolidZap } from "react-icons/bi";
import { Spinner } from "./ui/primitives";

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
      toast.success("Order accepted — get rolling");
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
    <div className="card animate-pop-in !bg-paper p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-mustard">
            <BiSolidZap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-smoke uppercase">
              New delivery request
            </p>
            <h3 className="font-display mt-0.5 text-lg font-extrabold">
              Order #{orderId.slice(-6)}
            </h3>
          </div>
        </div>
        <span
          className={`chip shrink-0 ${urgent ? "bg-tomato text-white" : "bg-butter"}`}
        >
          {secondsLeft}s left
        </span>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-paper">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            urgent ? "bg-tomato" : "bg-mustard"
          }`}
          style={{ width: `${secondsLeft * 10}%` }}
        />
      </div>

      <p className="mt-3 text-xs font-semibold text-smoke">
        Accept within {secondsLeft} seconds to claim this delivery.
      </p>

      <button
        type="button"
        disabled={accepting}
        onClick={acceptOrder}
        className="btn-primary mt-4 w-full !py-2.5"
      >
        {accepting ? (
          <Spinner size={16} className="text-white" />
        ) : (
          <BiSolidZap className="h-4 w-4" />
        )}
        {accepting ? "Accepting…" : "Accept order"}
      </button>
    </div>
  );
};

export default RiderOrderRequest;
