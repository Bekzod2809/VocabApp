namespace VocabApp.Api.Mappings;

public static class DateTimeExtensions
{
    // PostgreSQL "timestamp with time zone" faqat UTC qabul qiladi
    public static DateTime ToUtc(this DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
