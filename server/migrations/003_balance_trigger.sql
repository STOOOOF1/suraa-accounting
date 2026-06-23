-- ============================================================
-- تحديث رصيد الخزينة تلقائياً عند إضافة أو حذف حركة مالية
-- جمعية سفراء التعليمية - Sprint 3
-- ============================================================

-- دالة تحديث الرصيد عند إدراج حركة جديدة
CREATE OR REPLACE FUNCTION public.update_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'deposit' THEN
      UPDATE public.funds SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.fund_id;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE public.funds SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.fund_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'deposit' THEN
      UPDATE public.funds SET balance = balance - OLD.amount, updated_at = NOW() WHERE id = OLD.fund_id;
    ELSIF OLD.type = 'withdrawal' THEN
      UPDATE public.funds SET balance = balance + OLD.amount, updated_at = NOW() WHERE id = OLD.fund_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_update_balance ON public.fund_transactions;
CREATE TRIGGER trg_update_balance
  AFTER INSERT OR DELETE ON public.fund_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_balance_on_transaction();
