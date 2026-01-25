import { useControl } from "@conform-to/react/future";
import { useRef } from "react";

import { Switch } from "~/components/ui/switch";

interface ConformSwitchProps {
  id?: string;
  name: string;
  value?: string;
  defaultChecked?: boolean;
  ["aria-describedby"]?: string;
}

function ConformSwitch({ name, value, defaultChecked, ...props }: ConformSwitchProps) {
  const switchRef = useRef<React.ElementRef<typeof Switch>>(null);
  const control = useControl({
    defaultChecked,
    value,
    onFocus() {
      switchRef.current?.focus();
    },
  });

  return (
    <>
      <input type="checkbox" name={name} ref={control.register} hidden />
      <Switch
        {...props}
        ref={switchRef}
        checked={control.checked}
        onCheckedChange={(checked) => control.change(checked)}
        onBlur={() => control.blur()}
        className="focus:ring-primary focus:ring-1 focus:ring-offset-1"
      />
    </>
  );
}

export { ConformSwitch };