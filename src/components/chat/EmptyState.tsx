import { Bot } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-50 mb-4 shadow-sm">
        <Bot className="h-10 w-10 text-blue-600" />
      </div>
      <p className="text-neutral-900 font-semibold text-lg mb-2">Start a conversation to generate React components</p>
      <p className="text-neutral-500 text-sm max-w-sm">I can help you create buttons, forms, cards, and more</p>
    </div>
  );
}
