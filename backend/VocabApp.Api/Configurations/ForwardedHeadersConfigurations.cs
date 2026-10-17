using Microsoft.AspNetCore.HttpOverrides;

namespace VocabApp.Api.Configurations;

public static class ForwardedHeadersConfigurations
{
    // Serverda API nginx ortida turadi: haqiqiy IP X-Forwarded-For header'ida keladi.
    // Usiz rate limit hamma so'rovni nginx'ning bitta IP'sidan kelgan deb hisoblaydi.
    // API faqat 127.0.0.1 da ochiq (docker-compose), shuning uchun header'ga ishonish xavfsiz.
    public static void ConfigureForwardedHeaders(this WebApplicationBuilder builder)
    {
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }
}
