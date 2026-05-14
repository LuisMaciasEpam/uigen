import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }
      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };
      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: { promptTokens: 50, completionTokens: 30 },
      };
      return;
    }

    if (toolMessageCount === 2) {
      const text = `Now let me add some interactive polish.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }
      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };
      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: { promptTokens: 50, completionTokens: 30 },
      };
      return;
    }

    if (toolMessageCount === 0) {
      const text = `This is a static demo — add an ANTHROPIC_API_KEY in .env to generate components with Claude. Here is a sample ${componentName}.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }
      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };
      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: { promptTokens: 50, completionTokens: 30 },
      };
      return;
    }

    if (toolMessageCount >= 3) {
      const text = `Done! Here is your ${componentName} component — it is ready to customise.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }
      yield {
        type: "finish",
        finishReason: "stop",
        usage: { promptTokens: 50, completionTokens: 50 },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Message sent!</h3>
        <p className="text-sm text-gray-500">We will get back to you within 24 hours.</p>
        <button onClick={() => setSubmitted(false)} className="mt-6 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Get in touch</h2>
      <p className="text-sm text-gray-500 mb-6">We typically reply within one business day.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
            placeholder="Jane Smith"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
            placeholder="jane@example.com"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={4}
            placeholder="How can we help?"
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
        </div>
        <button type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors">
          Send message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `const Card = ({
  title = "Design Systems",
  category = "Engineering",
  description = "A practical guide to building scalable component libraries that keep teams aligned and products consistent.",
  author = "Maya Patel",
  readTime = "5 min read",
}) => {
  return (
    <article className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      <div className="p-6">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-3">
          {category}
        </span>
        <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
              {author.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-700">{author}</span>
          </div>
          <span className="text-xs text-gray-400">{readTime}</span>
        </div>
      </div>
    </article>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);
  const reset = () => setCount(0);

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Counter</h2>
      <div className="text-7xl font-bold tabular-nums text-gray-800">{count}</div>
      <div className="flex items-center gap-3">
        <button onClick={decrement} aria-label="Decrement"
          className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 text-xl font-medium hover:bg-rose-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 transition-all">
          -
        </button>
        <button onClick={reset} aria-label="Reset"
          className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all">
          Reset
        </button>
        <button onClick={increment} aria-label="Increment"
          className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-600 text-xl font-medium hover:bg-indigo-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all">
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    setSubmitted(true);";
      case "card":
        return '      <div className="p-6">';
      default:
        return "  const increment = () => setCount((prev) => prev + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    setSubmitted(true);\n    console.log('Submitted:', formData);";
      case "card":
        return '      <div className="p-6 group-hover:bg-gray-50 transition-colors">';
      default:
        return "  const increment = () => setCount((prev) => Math.min(prev + 1, 99));";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Card />
      </div>
    </div>
  );
}`;
    }

    if (componentName === "ContactForm") {
      return `import ContactForm from '@/components/ContactForm';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
      <ContactForm />
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: { promptTokens: 100, completionTokens: 200 },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here") {
    console.log(
      "ANTHROPIC_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Claude."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return anthropic(MODEL);
}
