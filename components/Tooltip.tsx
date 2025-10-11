import * as TooltipPrim from "@radix-ui/react-tooltip";
const Tooltip = ({ children }) => {
  return (
    <TooltipPrim.Provider>
      <TooltipPrim.Root>
        <TooltipPrim.Trigger className="tool-tip-button btn btn-transparent">
          <i className="bi bi-question text-white" />
        </TooltipPrim.Trigger>
        <TooltipPrim.Portal>
          <TooltipPrim.Content>
            <div className='card p-1 bg-secondary text-primary mb-1 tool-tip'>
              {children}
            </div>
          </TooltipPrim.Content>
        </TooltipPrim.Portal>
      </TooltipPrim.Root>
    </TooltipPrim.Provider>
  )
}

export default Tooltip