import styled from "styled-components";
import { HeroIcon as SharedHeroIcon } from "../create-room/style";

export {
  BackButton,
  BackRow,
  Body,
  Cancel,
  ErrorText,
  Field,
  FieldBox,
  FieldIcon,
  FieldLabel,
  Form,
  Input,
  Panel,
  Submit,
  Subtitle,
  Title,
} from "../create-room/style";

export const HeroIcon = styled(SharedHeroIcon)`
  img {
    display: block;
    width: 3.6rem;
    height: 3.6rem;
  }
`;
