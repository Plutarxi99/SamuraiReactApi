export class LocationDto {
  city: string | null;
  country: string | null;
}

export class UserResponseDto {
  id: number;
  full_name: string | null;
  place_birthday: string | null;
  status_text: string | null;
  followed: boolean;
  location: LocationDto;
  is_blocked: boolean;
  photo: string | null;
}
