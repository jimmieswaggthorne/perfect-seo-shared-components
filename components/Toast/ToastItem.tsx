import { removeToast } from "@/perfect-seo-shared-components/lib/features/User";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { useDispatch } from "react-redux";

const ToastItem = ({ title, content, ...props }) => {
  const dispatch = useDispatch();
  const clickHandler = (e) => {

  }
  const changeHandler = (open) => {
    if (!open) {
      dispatch(removeToast(props.id))
    }
  }
  return (
    <ToastPrimitive.Root {...props} onOpenChange={changeHandler}>
      <div className="bg-light card toast-card w-100 mt-2">
        <div className="p-1 px-2 row d-flex align-items-center">
          {/* <div className="col-auto">
          </div> */}
          <div className="col">
            <div className="d-flex flex-column">
              {title && <ToastPrimitive.Title><strong>{title}</strong></ToastPrimitive.Title>}
              <ToastPrimitive.Description>{content}</ToastPrimitive.Description>
            </div>
          </div>
          <div className="col-auto">
            <ToastPrimitive.Close aria-label="Close" className="btn btn-transparent p-1" onClick={clickHandler}>
              <i className="bi bi-x" />
            </ToastPrimitive.Close>
          </div>
        </div>
      </div>
    </ToastPrimitive.Root >
  );
};

export default ToastItem;
