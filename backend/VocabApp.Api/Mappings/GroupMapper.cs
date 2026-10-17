using VocabApp.Api.Dtos;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Mappings;

public static class GroupMapper
{
    public static Group ToEntity(this GroupSyncDto dto, long version)
    {
        return new Group
        {
            GroupId = dto.Id,
            Name = dto.Name.Trim(),
            CreatedAt = dto.CreatedAt.ToUtc(),
            UpdatedAt = dto.UpdatedAt.ToUtc(),
            IsDeleted = dto.IsDeleted,
            Version = version
        };
    }

    public static GroupSyncDto ToSyncDto(this Group group)
    {
        return new GroupSyncDto
        {
            Id = group.GroupId,
            Name = group.Name,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt,
            IsDeleted = group.IsDeleted
        };
    }

    public static void ToUpdateEntity(this GroupSyncDto dto, Group group, long version)
    {
        group.Name = dto.Name.Trim();
        group.UpdatedAt = dto.UpdatedAt.ToUtc();
        group.IsDeleted = dto.IsDeleted;
        group.Version = version;
    }
}
