import { format } from "date-fns"
import { CalendarIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDay, parseDay } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Date picker whose value is a "YYYY-MM-DD" string, or "" for none. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "No date",
  invalid,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseDay(value) : undefined

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            aria-invalid={invalid}
            className={cn("flex-1 justify-start font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon data-icon="inline-start" />
            {value ? formatDay(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "")
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" aria-label="Clear date" onClick={() => onChange("")}>
          <XIcon />
        </Button>
      )}
    </div>
  )
}
