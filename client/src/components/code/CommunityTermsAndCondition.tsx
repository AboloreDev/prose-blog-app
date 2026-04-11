"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { guidelines } from "@/constants/guidelines";

type TermsAndConditionsProps = {
  open: boolean;
  onAccepted: () => void;
};

export default function TermsAndConditions({
  open,
  onAccepted,
}: TermsAndConditionsProps) {
  const [checked, setChecked] = React.useState(false);

  return (
    <Sheet open={open} modal>
      <SheetContent
        side="right"
        className="!w-full md:!max-w-2xl p-4 text-[#4B5563] bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA] overflow-y-auto space-y-3 py-6 lato-regular"
      >
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900">
                Welcome to Prose
              </SheetTitle>
              <p className="text-sm text-gray-600 font-medium">
                Community Guidelines
              </p>
            </div>
          </div>

          <p className="text-gray-700 font-medium leading-relaxed">
            Prose is home to thousands of communities. Find your people, share
            your passions, and keep things respectful. Quick rules:
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-6 mt-8">
          {/* Guidelines List */}
          <div className="space-y-4 lato-regular">
            {guidelines.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-orange-200/50 hover:bg-white/80 transition-colors"
                >
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agreement Section */}
          <div className="mt-4 p-5 rounded-xl bg-white/80 border border-orange-200">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree"
                checked={checked}
                className="mt-1 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                onCheckedChange={(val) => setChecked(val === true)}
              />
              <label
                htmlFor="agree"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer"
              >
                I have read and agree to follow the{" "}
                <span className="font-semibold text-orange-700">
                  Prose Community Guidelines
                </span>
                . I understand that violating these rules may result in content
                removal or account suspension.
              </label>
            </div>
          </div>

          <Button
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!checked}
            onClick={onAccepted}
          >
            Join the Community
          </Button>

          <p className="text-xs text-center text-gray-500">
            By joining, you also agree to our{" "}
            <a href="#" className="text-orange-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-orange-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
