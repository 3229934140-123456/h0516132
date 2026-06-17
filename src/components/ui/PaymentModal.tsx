import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useStore, type PaymentTermWithDetails } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
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
  const { showToast } = useToast();
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

  const remainingAmount = useMemo(() => {
    if (!paymentTerm) return 0;
    return paymentTerm.amount - (paymentTerm.paidAmount || 0);
  }, [paymentTerm]);

  const amountNum = useMemo(() => {
    const num = parseFloat(amount);
    return isNaN(num) ? 0 : num;
  }, [amount]);

  const validation = useMemo(() => {
    if (!paymentTerm) {
      return {
        isValid: amountNum > 0,
        error: "",
        hint: "",
        hintType: "default" as const,
      };
    }

    if (!amount || amountNum <= 0) {
      return {
        isValid: false,
        error: "",
        hint: `剩余应收：${formatCurrency(remainingAmount)}`,
        hintType: "default" as const,
      };
    }

    if (amountNum > remainingAmount) {
      return {
        isValid: false,
        error: "收款金额不能超过剩余应收金额",
        hint: `剩余应收：${formatCurrency(remainingAmount)}`,
        hintType: "error" as const,
      };
    }

    if (Math.abs(amountNum - remainingAmount) < 0.01) {
      return {
        isValid: true,
        error: "",
        hint: "本次收款后将全额结清",
        hintType: "success" as const,
      };
    }

    const remainingAfter = remainingAmount - amountNum;
    return {
      isValid: true,
      error: "",
      hint: `部分收款，剩余 ${formatCurrency(remainingAfter)} 将继续保留在待收款中`,
      hintType: "info" as const,
    };
  }, [amount, amountNum, remainingAmount, paymentTerm]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
      return;
    }
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!paymentTerm || !validation.isValid || !paymentDate || !paymentMethod) return;
    setSubmitting(true);
    const method = paymentMethod as "bank_transfer" | "cash" | "check" | "other";
    const result = await createPaymentRecord({
      contractId: paymentTerm.contractId,
      paymentTermId: paymentTerm.id,
      amount: amountNum,
      paymentDate,
      paymentMethod: method,
      remark,
    });
    setSubmitting(false);
    if (result.success) {
      if (result.isFullPayment) {
        showToast("收款成功，该付款节点已全额结清", "success");
      } else {
        showToast(`部分收款成功，剩余 ${formatCurrency(result.remainingAfter || 0)} 待收`, "success");
      }
      onClose();
    } else {
      showToast(result.error || "收款失败", "error");
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
          <div className="rounded-lg bg-forest-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-forest-600">应收</span>
              <span className="text-lg font-semibold text-forest-900">
                {formatCurrency(paymentTerm.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-forest-600">已收</span>
              <span className="text-sm font-medium text-forest-700">
                {formatCurrency(paymentTerm.paidAmount || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-forest-200 pt-2">
              <span className="text-sm text-forest-600">剩余应收</span>
              <span className="text-lg font-semibold text-amber-600">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>收款金额（元）</label>
          <input
            type="text"
            inputMode="decimal"
            className={cn(
              inputClass,
              "font-medium tabular-nums",
              validation.error && "border-red-500 focus:ring-red-500",
            )}
            value={amount}
            onChange={handleAmountChange}
            placeholder="请输入收款金额"
          />
          <div className="mt-2 min-h-[20px]">
            {validation.error ? (
              <p className="text-sm text-red-600">{validation.error}</p>
            ) : validation.hint ? (
              <p
                className={cn(
                  "text-sm",
                  validation.hintType === "success" && "text-forest-600",
                  validation.hintType === "error" && "text-red-600",
                  validation.hintType === "info" && "text-forest-600",
                  validation.hintType === "default" && "text-forest-500",
                )}
              >
                {validation.hint}
              </p>
            ) : null}
          </div>
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
          disabled={submitting || !validation.isValid || !paymentDate || amountNum <= 0}
        >
          {submitting ? "提交中..." : "确认收款"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
