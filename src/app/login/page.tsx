"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import Link from "next/link";
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
import { getCountries } from "@/lib/api/public";
import type { CountrySequence } from "@/types/api";

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Telefon nömrəsi tələb olunur")
    .regex(/^\d+$/, "Telefon nömrəsi yalnız rəqəmlərdən ibarət olmalıdır"),
  password: z.string().min(4, "Şifrə ən azı 4 simvol olmalıdır"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [loading, setLoading] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("+994");
  const [countries, setCountries] = useState<CountrySequence[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const watchedPhoneNumber = watch("phoneNumber");

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

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      // Telefon nömrəsini country code ilə birləşdir
      const fullPhoneNumber = `${selectedCountryCode}${data.phoneNumber.trim()}`;
      
      const result = await signIn("credentials", {
        userName: fullPhoneNumber, // Telefon nömrəsini userName kimi göndər
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Giriş uğursuz oldu. Telefon nömrəsi və ya şifrə yanlışdır.");
      } else {
        toast.success("Uğurla daxil oldunuz!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>
            Daxil olmaq üçün telefon nömrənizi və şifrənizi yazın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefon Nömrəsi</Label>
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
                  {...register("phoneNumber")}
                  disabled={loading || loadingCountries}
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
              </div>
              {watchedPhoneNumber && selectedCountryCode && (
                <p className="text-xs text-stone-500">
                  Tam nömrə: <strong>{selectedCountryCode}{watchedPhoneNumber}</strong>
                </p>
              )}
              {errors.phoneNumber && (
                <p className="text-xs text-red-500">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifrə</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || loadingCountries}>
              {loading ? "Daxil olunur..." : "Daxil ol"}
            </Button>

            <div className="mt-4 space-y-2">
              <div className="text-center">
                <Link
                  href="/reset-password"
                  className="text-sm font-medium text-stone-600 underline hover:text-stone-900"
                >
                  Şifrəni unutdum?
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
