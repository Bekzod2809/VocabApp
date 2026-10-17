namespace VocabApp.Api.Middlewares;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate Next;
    private readonly ILogger<RequestLoggingMiddleware> Logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        Next = next;
        Logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        var start = DateTime.Now;

        Logger.LogInformation(
            "Request: {Time} {Method} {Path}",
            start,
            context.Request.Method,
            context.Request.Path);

        await Next(context);

        var time = DateTime.Now - start;

        Logger.LogInformation(
            "Response: {Time} {StatusCode} {Method} {Path} DurationMs: {Duration}",
            DateTime.Now,
            context.Response.StatusCode,
            context.Request.Method,
            context.Request.Path,
            time.TotalMilliseconds);
    }
}

public static class RequestLoggingMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestLogging(
        this IApplicationBuilder app)
    {
        return app.UseMiddleware<RequestLoggingMiddleware>();
    }
}
