import { Button } from "@base-ui/react";
import { useFilterBar } from "@/ui/filter-bar/context";

export function FilterBarClear({ children, ...props }: Button.Props) {
  const { clearActiveView, setValues } = useFilterBar()
  const handleButtonClick = () => {
    clearActiveView?.()
    setValues?.([])
  }
  return (
    <Button {...props} onClick={handleButtonClick}>
      {children}
    </Button>
  )
}
