import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationDto {
  @ApiPropertyOptional({ example: 'Moscow', nullable: true })
  city: string | null;

  @ApiPropertyOptional({ example: 'Russia', nullable: true })
  country: string | null;
}

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiPropertyOptional({ example: 'John Doe', nullable: true })
  full_name: string | null;

  @ApiPropertyOptional({ example: 'Samara', nullable: true })
  place_birthday: string | null;

  @ApiPropertyOptional({ example: 'Frontend developer', nullable: true })
  status_text: string | null;

  @ApiProperty({ example: false, description: 'Whether the current user follows this user' })
  followed: boolean;

  @ApiProperty({ type: () => LocationDto })
  location: LocationDto;

  @ApiProperty({ example: false, description: 'Whether the current user has blocked this user' })
  is_blocked: boolean;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/api/uploads/avatars/abc.jpg',
    nullable: true,
    description: 'Full URL of the user avatar',
  })
  photo: string | null;
}
