
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calculator, Clock, Calendar, Info, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  calculateOptionPremium,
  calculateGreeks,
  dateToTimeToExpiry,
  durationToTimeToExpiry,
} from "@/utils/blackScholes";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const greekDescriptions = {
  delta: "Change in option price for a $1 change in the underlying price.",
  gamma: "Rate of change of Delta with respect to the underlying price.",
  theta: "Change in option price per day passing (time decay).",
  vega: "Change in option price for a 1% change in volatility.",
  rho: "Change in option price for a 1% change in interest rate."
};

export const OptionCalculator = () => {
  const isMobile = useIsMobile();
  
  // Form state
  const [spotPrice, setSpotPrice] = useState<number>(100);
  const [strikePrice, setStrikePrice] = useState<number>(100);
  const [volatility, setVolatility] = useState<number>(30);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(5);
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [timeMethod, setTimeMethod] = useState<"date" | "duration">("date");
  
  // Date expiry state
  const [expiryDate, setExpiryDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days in the future
    return date;
  });
  const [expiryHour, setExpiryHour] = useState<string>("16");
  const [expiryMinute, setExpiryMinute] = useState<string>("00");
  
  // Duration expiry state
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  
  // Calculation results
  const [premium, setPremium] = useState<number>(0);
  const [greeks, setGreeks] = useState({
    delta: 0,
    gamma: 0,
    theta: 0,
    vega: 0,
    rho: 0
  });
  
  // Animation states
  const [animatePremium, setAnimatePremium] = useState(false);
  
  // Handle calculations
  useEffect(() => {
    try {
      let timeToExpiry: number;
      
      if (timeMethod === "date") {
        // Create a date object with the selected date and time
        const expiryDateTime = new Date(expiryDate);
        expiryDateTime.setHours(parseInt(expiryHour), parseInt(expiryMinute), 0);
        timeToExpiry = dateToTimeToExpiry(expiryDateTime);
      } else {
        timeToExpiry = durationToTimeToExpiry(hours, minutes, seconds);
      }
      
      // Validate inputs
      if (
        spotPrice <= 0 ||
        strikePrice <= 0 ||
        volatility <= 0 ||
        timeToExpiry <= 0
      ) {
        return; // Don't calculate with invalid inputs
      }
      
      // Convert percentage inputs to decimals for calculation
      const volatilityDecimal = volatility / 100;
      const riskFreeRateDecimal = riskFreeRate / 100;
      
      // Calculate option premium
      const optionPremium = calculateOptionPremium(
        spotPrice,
        strikePrice,
        timeToExpiry,
        volatilityDecimal,
        riskFreeRateDecimal,
        optionType === "call"
      );
      
      // Calculate Greeks
      const optionGreeks = calculateGreeks(
        spotPrice,
        strikePrice,
        timeToExpiry,
        volatilityDecimal,
        riskFreeRateDecimal,
        optionType === "call"
      );
      
      // Trigger animation effect
      setAnimatePremium(true);
      
      // Update state with calculation results
      setPremium(optionPremium);
      setGreeks(optionGreeks);
      
      // Reset animation state after animation completes
      setTimeout(() => {
        setAnimatePremium(false);
      }, 300);
    } catch (error) {
      console.error("Calculation error:", error);
      toast.error("Error calculating option values. Please check your inputs.");
    }
  }, [
    spotPrice,
    strikePrice,
    volatility,
    riskFreeRate,
    optionType,
    timeMethod,
    expiryDate,
    expiryHour,
    expiryMinute,
    hours,
    minutes,
    seconds
  ]);
  
  // Generate time options for select components
  const hourOptions = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, "0")
  );
  
  const minuteOptions = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, "0")
  );
  
  // Validate and update numeric input
  const handleNumericInput = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<number>>,
    min: number = 0
  ) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= min) {
      setter(parsed);
    } else if (value === "") {
      setter(0); // Allow clearing input
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-groww-blue" />
          <h1 className="text-xl sm:text-2xl font-bold">Options Premium Calculator</h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-groww-blue animate-pulse-slow" />
          <span className="text-muted-foreground">Powered by Black-Scholes</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Input Section */}
        <div className="col-span-1 md:col-span-2 space-y-4 md:space-y-6">
          <Card className="grecian-blur dark:shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Option Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Spot Price */}
                <div className="option-input-group">
                  <Label htmlFor="spotPrice" className="option-label">
                    Current Price ($)
                  </Label>
                  <Input
                    id="spotPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={spotPrice}
                    onChange={(e) => 
                      handleNumericInput(e.target.value, setSpotPrice, 0.01)
                    }
                    className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                  />
                </div>
                
                {/* Strike Price */}
                <div className="option-input-group">
                  <Label htmlFor="strikePrice" className="option-label">
                    Strike Price ($)
                  </Label>
                  <Input
                    id="strikePrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={strikePrice}
                    onChange={(e) => 
                      handleNumericInput(e.target.value, setStrikePrice, 0.01)
                    }
                    className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                  />
                </div>
                
                {/* Option Type */}
                <div className="option-input-group">
                  <Label className="option-label">Option Type</Label>
                  <ToggleGroup
                    type="single"
                    value={optionType}
                    onValueChange={(value) => 
                      value && setOptionType(value as "call" | "put")
                    }
                    className="justify-start"
                  >
                    <ToggleGroupItem 
                      value="call" 
                      className={cn(
                        "transition-all duration-200",
                        optionType === "call" ? "bg-groww-blue text-white animate-scale" : ""
                      )}
                    >
                      Call
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="put"
                      className={cn(
                        "transition-all duration-200",
                        optionType === "put" ? "bg-groww-blue text-white animate-scale" : ""
                      )}
                    >
                      Put
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                {/* Implied Volatility */}
                <div className="option-input-group">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="volatility" className="option-label">
                      Implied Volatility (%)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-groww-blue transition-colors duration-200" />
                        </TooltipTrigger>
                        <TooltipContent className="animate-scale">
                          <p className="max-w-xs text-xs">
                            Implied volatility represents the expected volatility of the underlying asset.
                            Typically ranges from 10% to 100% for most assets.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="volatility"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={volatility}
                    onChange={(e) => 
                      handleNumericInput(e.target.value, setVolatility, 0.1)
                    }
                    className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                  />
                </div>
                
                {/* Risk-Free Rate */}
                <div className="option-input-group">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="riskFreeRate" className="option-label">
                      Risk-Free Rate (%)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-groww-blue transition-colors duration-200" />
                        </TooltipTrigger>
                        <TooltipContent className="animate-scale">
                          <p className="max-w-xs text-xs">
                            The risk-free interest rate, typically based on government bond yields.
                            Usually between 1% and 10%.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="riskFreeRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={riskFreeRate}
                    onChange={(e) => 
                      handleNumericInput(e.target.value, setRiskFreeRate)
                    }
                    className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Time to Expiry Section */}
          <Card className="grecian-blur dark:shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Time to Expiry</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="date"
                value={timeMethod}
                onValueChange={(value) => setTimeMethod(value as "date" | "duration")}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="date" className="flex items-center gap-1.5 transition-all duration-200">
                    <Calendar className="h-4 w-4" />
                    <span>Expiry Date</span>
                  </TabsTrigger>
                  <TabsTrigger value="duration" className="flex items-center gap-1.5 transition-all duration-200">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="date" className="mt-0 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor="expiryDate" className="option-label">
                        Expiry Date
                      </Label>
                      <div className="mt-1.5">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal transition-all duration-200 hover:border-groww-blue"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {expiryDate ? (
                                format(expiryDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 animate-scale" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={expiryDate}
                              onSelect={(date) => date && setExpiryDate(date)}
                              initialFocus
                              disabled={(date) => date < new Date()}
                              className={cn("p-3")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="option-label">Expiry Time</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <Select
                          value={expiryHour}
                          onValueChange={setExpiryHour}
                        >
                          <SelectTrigger className="transition-all duration-200 hover:border-groww-blue">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent className="animate-scale">
                            {hourOptions.map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={expiryMinute}
                          onValueChange={setExpiryMinute}
                        >
                          <SelectTrigger className="transition-all duration-200 hover:border-groww-blue">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent className="animate-scale">
                            {minuteOptions.map((minute) => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="duration" className="mt-0 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="option-input-group">
                      <Label htmlFor="hours" className="option-label">
                        Hours
                      </Label>
                      <Input
                        id="hours"
                        type="number"
                        min="0"
                        value={hours}
                        onChange={(e) => 
                          handleNumericInput(e.target.value, setHours)
                        }
                        className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                      />
                    </div>
                    
                    <div className="option-input-group">
                      <Label htmlFor="minutes" className="option-label">
                        Minutes
                      </Label>
                      <Input
                        id="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(e) => 
                          handleNumericInput(e.target.value, setMinutes)
                        }
                        className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                      />
                    </div>
                    
                    <div className="option-input-group">
                      <Label htmlFor="seconds" className="option-label">
                        Seconds
                      </Label>
                      <Input
                        id="seconds"
                        type="number"
                        min="0"
                        max="59"
                        value={seconds}
                        onChange={(e) => 
                          handleNumericInput(e.target.value, setSeconds)
                        }
                        className="text-sm transition-all duration-200 hover:border-groww-blue focus:border-groww-blue"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Results Section */}
        <div className="col-span-1 space-y-4">
          <Card className="grecian-blur dark:shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Option Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl sm:text-3xl font-bold text-groww-blue transition-all duration-200",
                animatePremium && "animate-scale"
              )}>
                ${premium.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {optionType === "call" ? "Call" : "Put"} option price
              </p>
            </CardContent>
          </Card>
          
          <Card className="grecian-blur dark:shadow-lg">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg">Greeks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(greeks).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-groww-blue transition-colors duration-200 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent side={isMobile ? "top" : "right"} className="animate-scale">
                            <p className="max-w-xs text-xs">
                              {greekDescriptions[key as keyof typeof greekDescriptions]}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className={cn(
                      "font-medium transition-all duration-200",
                      animatePremium && "animate-scale"
                    )}>
                      {value.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OptionCalculator;
