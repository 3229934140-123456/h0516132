import { useState, useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useStore, type PaymentTermWithDetails } from "@/store/useStore";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  paymentTerm?: PaymentTermWithDetails | null;
}

const paymentMethodOptions: {
  value: "online" | "bank_transfer" | "cash" | "check" | "other";
  label: string;
}[] = [
  { value: "online", label: "在线支付" },
  { value: "bank_transfer", label: "银行转账" },
  { value: "cash", label: "现金" },
  { value: "check", label: "支票" },
  { value: "other", label: "其他" },
];

export function PaymentModal({ open, onClose, paymentTerm }: PaymentModalProps) {
  const createPaymentRecord = useStore((s) => s.createPaymentRecord);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const remaining = paymentTerm
        ? paymentTerm.amount - (paymentTerm.paidAmount || 0)
        : 0;
      setAmount(remaining > 0 ? String(remaining) : String(paymentTerm?.amount || ""));
      setPaymentMethod("bank_transfer");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setRemark(paymentTerm?.description ? `[${paymentTerm.description}]` : "");
      setSubmitting(false);
    }
  }, [open, paymentTerm]);

  const handleSubmit = async () => {
    if (!paymentTerm || !amount || !paymentDate || !paymentMethod) return;
    setSubmitting(true);
    const method = paymentMethod as "bank_transfer" | "cash" | "check" | "other";
    const success = await createPaymentRecord({
      contractId: paymentTerm.contractId,
      paymentTermId: paymentTerm.id,
      amount: Number(amount),
      paymentDate,
      paymentMethod: method,
      remark,
    });
    setSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-forest-200 bg-white px-3 py-2 text-sm text-forest-900 placeholder:text-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2";

  const labelClass = "block text-sm font-medium text-forest-700 mb-1.5";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="标记收款"
      description={
        paymentTerm
          ? `${paymentTerm.contractName || "合同"} - ${paymentTerm.description || "付款节点"}`
          : undefined
      }
    >
      <ModalBody className="space-y-4">
        {paymentTerm && (
          <div className="rounded-lg bg-forest-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-forest-600">应收金额</span>
              <span className="text-lg font-semibold text-forest-900">
                {formatCurrency(paymentTerm.amount)}
              </span>
            </div>
            {paymentTerm.paidAmount > 0 && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-forest-600">已收金额</span>
                <span className="text-sm font-medium text-forest-700">
                  {formatCurrency(paymentTerm.paidAmount)}
                </span>
              </div>
            )}
            {(paymentTerm.amount - (paymentTerm.paidAmount || 0)) > 0 &&
              (paymentTerm.paidAmount || 0) > 0 && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-forest-600">待收金额</span>
                  <span className="text-sm font-semibold text-amber-600">
                    {formatCurrency(paymentTerm.amount - paymentTerm.paidAmount)}
                  </span>
                </div>
              )}
          </div>
        )}

        <div>
          <label className={labelClass}>收款金额（元）</label>
          <input
            type="number"
            className={cn(inputClass, "font-medium tabular-nums")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="请输入收款金额"
            min={0}
            step={0.01}
          />
        </div>

        <div>
          <label className={labelClass}>付款方式</label>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaymentMethod(opt.value)}
                className={cn(
                  "h-10 rounded-lg border px-3 text-sm font-medium transition-colors",
                  paymentMethod === opt.value
                    ? "border-forest-700 bg-forest-700 text-white"
                    : "border-forest-200 bg-white text-forest-700 hover:bg-forest-50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>收款日期</label>
          <input
            type="date"
            className={inputClass}
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>备注</label>
          <textarea
            className={cn(inputClass, "h-20 resize-none py-2")}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="可选：填写收款备注信息"
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button
          variant="default"
          onClick={handleSubmit}
          disabled={submitting || !amount || !paymentDate || Number(amount) <= 0}
        >
          {submitting ? "提交中..." : "确认收款"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
