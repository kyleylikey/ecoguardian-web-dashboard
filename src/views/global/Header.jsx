import { Title, Box, Text } from '@mantine/core';

export const Header = ({title, subtitle}) => {
  return (
    <Box mb="30px">
      <Title order={1} c="verdigris">{title}</Title>

      <Text c="dimmed">{subtitle}</Text>
    </Box>
  );
}