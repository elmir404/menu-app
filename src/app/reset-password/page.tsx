"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  getCountries,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  resendOtp,
} from "@/lib/api/public";
import type {
  CountrySequence,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
} from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ResetPasswordStep = "forgot" | "verify" | "reset";

const forgotSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Telefon nömrəsi məcburidir")
    .regex(/^\d+$/, "Telefon nömrəsi yalnız rəqəmlərdən ibarət olmalıdır"),
});

const verifySchema = z.object({
  otpCode: z
    .string()
    .min(4, "OTP kodu minimum 4 rəqəmli olmalıdır")
    .max(6, "OTP kodu maksimum 6 rəqəmli olmalıdır")
    .regex(/^\d+$/, "OTP kodu yalnız rəqəmlərdən ibarət olmalıdır"),
});

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(4, "Şifrə minimum 4 simvol olmalıdır")
      .min(1, "Yeni şifrə məcburidir"),
    confirmPassword: z.string().min(1, "Şifrə təsdiqi məcburidir"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifrələr uyğun gəlmir",
    path: ["confirmPassword"],
  });

type ForgotFormData = z.infer<typeof forgotSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetPasswordStep>("forgot");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("+994");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [userId, setUserId] = useState<number | null>(null); // ResendOtp üçün
  const [countries, setCountries] = useState<CountrySequence[]>([]);
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: errorsForgot },
    watch: watchForgot,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const watchedPhoneNumber = watchForgot("phoneNumber");

  // Ölkələri yüklə
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const data = await getCountries();
        setCountries(data);
        const azerbaijan = data.find((c) => c.countryCode === 994);
        if (azerbaijan) {
          setSelectedCountryCode(`+${azerbaijan.countryCode}`);
        } else if (data.length > 0) {
          setSelectedCountryCode(`+${data[0].countryCode}`);
        }
      } catch (error) {
        console.error("Countries yüklənərkən xəta:", error);
        setSelectedCountryCode("+994");
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Telefon nömrəsi dəyişdikdə full phone number-i yenilə
  useEffect(() => {
    if (watchedPhoneNumber?.trim()) {
      setFullPhoneNumber(`${selectedCountryCode}${watchedPhoneNumber.trim()}`);
    } else {
      setFullPhoneNumber("");
    }
  }, [selectedCountryCode, watchedPhoneNumber]);

  // Step 1: Şifrə unutma - OTP göndər
  const onForgotSubmit = async (data: ForgotFormData) => {
    setLoading(true);
    try {
      const fullPhone = `${selectedCountryCode}${data.phoneNumber.trim()}`;
      const request: ForgotPasswordRequest = { phoneNumber: fullPhone };
      const response = await forgotPassword(request);

      if (response.otpSent) {
        toast.success(response.message || "OTP telefon nömrənizə göndərildi");
        setPhoneNumber(data.phoneNumber);
        setStep("verify");
        // Qeyd: Əgər backend-dən userId qayıdırsa, onu burada set edin
        // Məs: if (response.userId) setUserId(response.userId);
      } else {
        toast.error(response.message || "Bu telefon nömrəsi ilə istifadəçi tapılmadı");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "OTP göndərilərkən xəta baş verdi";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP yoxla
  const onVerifySubmit = async (data: VerifyFormData) => {
    setLoading(true);
    try {
      const fullPhone = `${selectedCountryCode}${phoneNumber.trim()}`;
      const request: VerifyOtpRequest = {
        phoneNumber: fullPhone,
        otpCode: data.otpCode.trim(),
      };
      const response = await verifyForgotPasswordOtp(request);

      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        toast.success(response.message || "OTP doğrulandı. İndi şifrənizi sıfırlaya bilərsiniz");
        setStep("reset");
      } else {
        toast.error(response.message || "OTP kodu yanlışdır və ya müddəti bitib");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "OTP yoxlanılarkən xəta baş verdi";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Şifrəni sıfırla
  const onResetSubmit = async (data: ResetFormData) => {
    setLoading(true);
    try {
      const request: ResetPasswordRequest = {
        resetToken,
        newPassword: data.newPassword.trim(),
        confirmPassword: data.confirmPassword.trim(),
      };
      await resetPassword(request);
      toast.success("Şifrə uğurla sıfırlandı");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Şifrə sıfırlanarkən xəta baş verdi";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // OTP resend
  const handleResendOtp = async () => {
    if (!phoneNumber.trim()) return;
    
    // Əgər userId varsa, ResendOtp endpoint-ini istifadə et
    if (userId) {
      setLoading(true);
      try {
        const request: ResendOtpRequest = {
          userId,
          purpose: "PasswordReset",
        };
        const response = await resendOtp(request);
        if (response.otpSent) {
          toast.success("OTP yenidən göndərildi");
        } else {
          toast.error("OTP göndərilə bilmədi");
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "OTP yenidən göndərilərkən xəta baş verdi";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      // userId yoxdursa, forgot-password-i yenidən çağır
      setLoading(true);
      try {
        const fullPhone = `${selectedCountryCode}${phoneNumber.trim()}`;
        const request: ForgotPasswordRequest = { phoneNumber: fullPhone };
        const response = await forgotPassword(request);
        if (response.otpSent) {
          toast.success("OTP yenidən göndərildi");
        } else {
          toast.error(response.message || "OTP göndərilə bilmədi");
        }
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || "OTP göndərilərkən xəta baş verdi";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("forgot");
    } else if (step === "reset") {
      setStep("verify");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Şifrəni Sıfırla</CardTitle>
          <CardDescription>
            {step === "forgot" && "Telefon nömrənizi daxil edin"}
            {step === "verify" && "OTP kodunu daxil edin"}
            {step === "reset" && "Yeni şifrənizi daxil edin"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Telefon nömrəsi */}
          {step === "forgot" && (
            <form onSubmit={handleSubmitForgot(onForgotSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefon Nömrəsi *</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCountryCode}
                    onValueChange={setSelectedCountryCode}
                    disabled={loading || loadingCountries}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ölkə" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCountries ? (
                        <SelectItem value="+994">Yüklənir...</SelectItem>
                      ) : (
                        countries.map((country) => (
                          <SelectItem
                            key={country.countryCode}
                            value={`+${country.countryCode}`}
                          >
                            {country.flag} {country.name} (+{country.countryCode})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="501234567"
                    {...registerForgot("phoneNumber")}
                    disabled={loading || loadingCountries}
                    className={errorsForgot.phoneNumber ? "border-red-500" : ""}
                  />
                </div>
                {fullPhoneNumber && (
                  <p className="text-xs text-stone-500">
                    Tam nömrə: <strong>{fullPhoneNumber}</strong>
                  </p>
                )}
                {errorsForgot.phoneNumber && (
                  <p className="text-xs text-red-500">
                    {errorsForgot.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Göndərilir..." : "OTP Göndər"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/login")}
                  disabled={loading}
                >
                  Geri
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: OTP yoxlama */}
          {step === "verify" && (
            <form onSubmit={handleSubmitVerify(onVerifySubmit)} className="space-y-4">
              <div className="rounded-lg bg-stone-50 p-3 text-center">
                <p className="text-sm text-stone-600">
                  Telefon nömrənizə göndərilən OTP kodunu daxil edin:
                </p>
                <p className="mt-1 font-semibold text-stone-900">
                  {fullPhoneNumber || `${selectedCountryCode}${phoneNumber}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otpCode">OTP Kodu *</Label>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...registerVerify("otpCode")}
                  disabled={loading}
                  className={errorsVerify.otpCode ? "border-red-500" : ""}
                  autoFocus
                />
                {errorsVerify.otpCode && (
                  <p className="text-xs text-red-500">
                    {errorsVerify.otpCode.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Yoxlanılır..." : "Yoxla"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Geri
                </Button>
              </div>

              <div className="text-center space-y-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-stone-600 underline hover:text-stone-900 disabled:text-stone-400"
                >
                  OTP-ni yenidən göndər
                </button>
                {!userId && (
                  <p className="text-xs text-stone-400 italic">
                    Qeyd: OTP-ni yenidən göndərmək üçün telefon nömrəsi istifadə olunur
                  </p>
                )}
              </div>
            </form>
          )}

          {/* Step 3: Yeni şifrə */}
          {step === "reset" && (
            <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4">
              <div className="rounded-lg bg-stone-50 p-3 text-center">
                <p className="text-sm text-stone-600">Yeni şifrənizi daxil edin:</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifrə *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Minimum 4 simvol"
                  {...registerReset("newPassword")}
                  disabled={loading}
                  className={errorsReset.newPassword ? "border-red-500" : ""}
                  autoFocus
                />
                {errorsReset.newPassword && (
                  <p className="text-xs text-red-500">
                    {errorsReset.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifrəni Təsdiqlə *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Şifrəni təkrar daxil edin"
                  {...registerReset("confirmPassword")}
                  disabled={loading}
                  className={errorsReset.confirmPassword ? "border-red-500" : ""}
                />
                {errorsReset.confirmPassword && (
                  <p className="text-xs text-red-500">
                    {errorsReset.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Sıfırlanır..." : "Şifrəni Sıfırla"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Geri
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
