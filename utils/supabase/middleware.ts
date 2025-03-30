// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
    // создаем response, изначально пустой
    const response = NextResponse.next();

    // создаём клиент Supabase middleware, передаём внутри запрос и ответ
    const supabase = createMiddlewareClient({ req: request, res: response });

    // проверяем авторизован ли пользователь
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // если пользователь не авторизован — отправляем на страницу логина
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // если пользователь авторизован — возвращаем текущий response (продолжается загрузка страницы как обычно)
    return response;
}

// определяем, для каких URL вы хотите применить Middleware
export const config = {
    matcher: ["/protected-route/:path*"],
};