import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { BiX } from "react-icons/bi";
import { Logo } from "../../components/brand/Logo";
import {
  Avatar,
  Badge,
  BottomSheet,
  BrandToaster,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Input,
  Modal,
  OrderStepper,
  SkeletonCard,
  SkeletonRow,
  StatusPill,
} from "../../components/ui";
import type { OrderStatus } from "../../types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** Dev-only gallery of every kit component. Not present in production builds. */
export default function UiPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chip, setChip] = useState("Pizza");
  const [stepStatus, setStepStatus] = useState<OrderStatus>("preparing");

  const statuses: OrderStatus[] = [
    "placed",
    "accepted",
    "preparing",
    "ready_for_rider",
    "rider_assigned",
    "picked_up",
    "delivered",
    "cancelled",
  ];

  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <Logo size={40} wordmarkClass="text-2xl" />
          <Badge tone="butter" rotate>
            dev preview
          </Badge>
        </header>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Order now</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="butter">Butter</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Cancel order</Button>
            <Button loading>Placing order…</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Icon buttons">
          <div className="flex flex-wrap items-center gap-3">
            <IconButton aria-label="Close" tone="sticker">
              <BiX size={20} />
            </IconButton>
            <IconButton aria-label="Delete" tone="danger">
              <BiX size={20} />
            </IconButton>
            <IconButton aria-label="Plain close">
              <BiX size={20} />
            </IconButton>
            <IconButton aria-label="Small close" size="sm">
              <BiX size={16} />
            </IconButton>
          </div>
        </Section>

        <Section title="Chips">
          <div className="flex flex-wrap gap-2">
            {["All", "Pizza", "Biryani", "Burgers", "Desserts"].map((c) => (
              <Chip
                key={c}
                selected={chip === c}
                onClick={() => setChip(c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" placeholder="Priya Sharma" />
            <Input label="Mobile" placeholder="98765 43210" hint="We call on delivery" />
            <Input label="With error" defaultValue="bad" error="Enter a valid value" />
            <Input placeholder="No label" />
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card variant="sticker" className="p-4">
              <p className="font-semibold">Sticker</p>
              <p className="text-sm text-ink/60">Ink border, hard shadow.</p>
            </Card>
            <Card variant="flat" className="p-4">
              <p className="font-semibold">Flat</p>
              <p className="text-sm text-ink/60">Quiet container.</p>
            </Card>
            <Card variant="interactive" className="p-4">
              <p className="font-semibold">Interactive</p>
              <p className="text-sm text-ink/60">Hover me.</p>
            </Card>
          </div>
        </Section>

        <Section title="Badges and status pills">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="tomato">tomato</Badge>
            <Badge tone="butter" rotate>
              butter
            </Badge>
            <Badge tone="basil">basil</Badge>
            <Badge tone="blue">blue</Badge>
            <Badge tone="ink">ink</Badge>
            <Badge tone="paper">paper</Badge>
            {statuses.map((status) => (
              <StatusPill key={status} status={status} />
            ))}
          </div>
        </Section>

        <Section title="Skeletons">
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <Card variant="flat">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </Card>
          </div>
        </Section>

        <Section title="Empty state">
          <Card variant="flat">
            <EmptyState
              mood="sad"
              title="No restaurants yet"
              description="We could not find any restaurants delivering to you right now."
              action={<Button variant="secondary">Change location</Button>}
            />
          </Card>
        </Section>

        <Section title="Avatars">
          <div className="flex items-center gap-3">
            <Avatar name="Priya Sharma" size="sm" />
            <Avatar name="Rahul Verma" />
            <Avatar name="Admin" size="lg" />
            <Avatar name="Photo" src="https://picsum.photos/96" size="lg" />
          </div>
        </Section>

        <Section title="Order stepper">
          <Card variant="sticker" className="p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {statuses.slice(0, 7).map((status) => (
                <Chip
                  key={status}
                  className="h-8 px-3 text-xs"
                  selected={stepStatus === status}
                  onClick={() => setStepStatus(status)}
                >
                  {status}
                </Chip>
              ))}
            </div>
            <OrderStepper status={stepStatus} />
            <div className="mt-6">
              <OrderStepper status={stepStatus} variant="detailed" />
            </div>
          </Card>
        </Section>

        <Section title="Overlays">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Open bottom sheet
            </Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              Open confirm dialog
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.success("Order placed successfully")}
            >
              Success toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.error("Could not reach the restaurant")}
            >
              Error toast
            </Button>
          </div>
        </Section>

        <footer className="pb-10 text-center text-xs text-ink/40">
          Tomato UI kit — dev preview (never bundled in production)
        </footer>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Demo modal">
        <p className="text-sm text-ink/70">
          Press Escape or tap outside to close. The panel carries the ink border
          and hard offset shadow from the sticker system.
        </p>
      </Modal>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Demo bottom sheet"
        footer={
          <Button fullWidth onClick={() => setSheetOpen(false)}>
            Add to cart · ₹240
          </Button>
        }
      >
        <p className="text-sm text-ink/70">
          Sheets slide up over mobile content and respect the safe area. The
          footer stays pinned for the primary action.
        </p>
      </BottomSheet>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        description="The restaurant has already started preparing your food."
        confirmLabel="Yes, cancel"
        tone="danger"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />

      <BrandToaster />
    </div>
  );
}
