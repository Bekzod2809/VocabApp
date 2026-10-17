using System.Threading.RateLimiting;

namespace VocabApp.Api.Configurations;

public static class RateLimitConfigurations
{
    public const string AuthPolicy = "auth";

    // Parolni tanlab topishga urinishdan himoya: bitta IP'dan daqiqasiga 5 ta urinish
    public static void ConfigureRateLimit(this WebApplicationBuilder builder)
    {
        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(AuthPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1)
                    }));
        });
    }
}
