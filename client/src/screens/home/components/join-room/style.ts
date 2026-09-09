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
  width: 5.1rem;
  height: 5.1rem;

  img {
    display: block;
    width: 4.4rem;
    height: 4.4rem;
  }
`;
