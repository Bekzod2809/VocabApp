using FluentValidation;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using VocabApp.Api.Configurations;
using VocabApp.Api.Middlewares;
using VocabApp.Api.Validators;

namespace VocabApp.Api;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddValidatorsFromAssembly(typeof(SyncRequestDtoValidator).Assembly);

        builder.Services.AddControllers();

        // JWT header'da yuboriladi (cookie emas), shuning uchun istalgan origin xavfsiz
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
                policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
        });

        builder.Services.AddHealthChecks()
            .AddCheck<HealthChecks.DatabaseHealthCheck>("database");

        builder.ConfigureSerilog();
        builder.ConfigureSwagger();
        builder.ConfigureDB();
        builder.ConfigureDI();
        builder.ConfigureJwt();
        builder.ConfigureRateLimit();
        builder.AddJwtAuthentication();


        var app = builder.Build();

        await app.ApplyMigrationsAsync();

        app.UseMiddleware<ExceptionMiddleware>();
        app.UseRequestLogging();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = async (context, report) =>
            {
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    Status = report.Status.ToString(),
                    TotalDurationMs = report.TotalDuration.TotalMilliseconds,
                    Checks = report.Entries.Select(e => new
                    {
                        Name = e.Key,
                        Status = e.Value.Status.ToString(),
                        Description = e.Value.Description,
                        DurationMs = e.Value.Duration.TotalMilliseconds
                    })
                });
            }
        });
        app.MapControllers();

        app.Run();
    }
}
